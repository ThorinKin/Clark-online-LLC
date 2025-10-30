//Server/Controllers/ImageEditController.cs
using Microsoft.AspNetCore.Mvc;
using System.Net.Http.Headers;
using System.Text.Json;
using Server.Services; // 引用命名空间

namespace Server.Controllers
{
    [ApiController]
    [Route("api/ai")]
    public class ImageEditController : ControllerBase
    {
        private readonly IHttpClientFactory _http;
        private readonly IConfiguration _cfg;
        private readonly ICreditService _credits; // 字段名 _credits

        public ImageEditController(IHttpClientFactory http, IConfiguration cfg, ICreditService credits)
        {
            _http = http;
            _cfg = cfg;
            _credits = credits; // 赋值给 _credits
        }

        private string? GetUserId() =>
            Request.Headers.TryGetValue("X-User-Id", out var v) ? v.ToString() : null;

        // 允许最多 25MB 的表单上传
        [HttpPost("image-edit")]
        [RequestFormLimits(MultipartBodyLengthLimit = 25 * 1024 * 1024)]
        [RequestSizeLimit(25 * 1024 * 1024)]
        public async Task<IActionResult> Edit(
            [FromForm] IFormFile image,
            [FromForm] string prompt,
            [FromForm] string? size,
            [FromForm] IFormFile? mask
        )
        {
            var uid = GetUserId();
            if (string.IsNullOrWhiteSpace(uid))
                return Unauthorized(new { message = "Missing X-User-Id" });

            if (image == null || string.IsNullOrWhiteSpace(prompt))
                return BadRequest(new { message = "image 和 prompt 不能为空" });

            const int COST = 1; // 点数消费价格

            // 先尝试扣分
            var ok = await _credits.TryConsumeAsync(uid, COST);
            if (!ok) return StatusCode(402, new { message = "Insufficient credits" }); // 402: Payment Required

            try
            {
                var apiKey = _cfg["OpenAI:ApiKey"] ?? _cfg["OpenAI__ApiKey"];
                if (string.IsNullOrWhiteSpace(apiKey))
                    return StatusCode(500, "OpenAI API key 未配置");

                var client = _http.CreateClient();
                client.DefaultRequestHeaders.Authorization =
                    new AuthenticationHeaderValue("Bearer", apiKey);

                var org = _cfg["OpenAI:OrganizationId"] ?? _cfg["OpenAI__OrganizationId"];
                var proj = _cfg["OpenAI:ProjectId"] ?? _cfg["OpenAI__ProjectId"];
                if (!string.IsNullOrEmpty(org)) client.DefaultRequestHeaders.Add("OpenAI-Organization", org);
                if (!string.IsNullOrEmpty(proj)) client.DefaultRequestHeaders.Add("OpenAI-Project", proj);

                using var form = new MultipartFormDataContent();
                form.Add(new StringContent("gpt-image-1"), "model");
                form.Add(new StringContent(prompt), "prompt");
                if (!string.IsNullOrWhiteSpace(size)) form.Add(new StringContent(size), "size");

                var imgContent = new StreamContent(image.OpenReadStream());
                imgContent.Headers.ContentType = new MediaTypeHeaderValue(image.ContentType);
                form.Add(imgContent, "image", image.FileName);

                if (mask != null)
                {
                    var maskContent = new StreamContent(mask.OpenReadStream());
                    maskContent.Headers.ContentType = new MediaTypeHeaderValue(mask.ContentType);
                    form.Add(maskContent, "mask", mask.FileName);
                }

                using var httpResp = await client.PostAsync("https://api.openai.com/v1/images/edits", form);
                var body = await httpResp.Content.ReadAsStringAsync();

                if (!httpResp.IsSuccessStatusCode)
                {
                    // 调用失败补偿退回积分
                    await _credits.AddAsync(uid, COST);
                    return StatusCode((int)httpResp.StatusCode, body);
                }

                using var doc = JsonDocument.Parse(body);
                var dataArr = doc.RootElement.GetProperty("data");
                if (dataArr.GetArrayLength() == 0)
                {
                    await _credits.AddAsync(uid, COST);
                    return StatusCode(502, "OpenAI 返回空结果");
                }

                var first = dataArr[0];
                string? b64 = first.TryGetProperty("b64_json", out var b64El) ? b64El.GetString() : null;
                string? url = first.TryGetProperty("url", out var urlEl) ? urlEl.GetString() : null;

                return Ok(new
                {
                    imageBase64 = b64,
                    imageUrl = url,
                    mime = b64 != null ? "image/png" : null
                });
            }
            catch (Exception ex)
            {
                await _credits.AddAsync(uid, COST); // 出错补偿
                return StatusCode(502, new { message = "解析/调用失败", error = ex.Message });
            }
        }
    }
}
