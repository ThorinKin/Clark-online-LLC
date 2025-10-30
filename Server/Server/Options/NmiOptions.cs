// Server/Server/Options/NmiOptions.cs
namespace Server.Options;

public class NmiOptions
{
    public const string SectionName = "NMI";

    public string PrivateApiKey { get; set; } = "69CW6P52Q2nwfz65U646ZnyXRazd2U5C";

    public string? PublicTokenizationKey { get; set; }

    public string BaseUrl { get; set; } = "https://secure.nmi.com";

    public string CheckoutEndpoint { get; set; } = "/collect/v1/checkout";

    public string TransactionLookupEndpoint { get; set; } = "/api/query";

    public string? WebhookSigningKey { get; set; }

    public string? SuccessUrlTemplate { get; set; }

    public string? CancelUrlTemplate { get; set; }
}