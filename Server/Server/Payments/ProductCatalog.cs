using System.Collections.Immutable;

namespace Server.Payments;

public record ProductDefinition(
    string Id,
    string Name,
    decimal Price,
    int Credits,
    string Type
);

public static class ProductCatalog
{
    private static readonly ImmutableDictionary<string, ProductDefinition> _products =
        new Dictionary<string, ProductDefinition>
        {
            ["conv-trial"] = new("conv-trial", "Trial Conversations", 0.99m, 5, "conversation"),
            ["conv-starter"] = new("conv-starter", "Starter Conversations", 4.99m, 20, "conversation"),
            ["conv-pro"] = new("conv-pro", "Pro Conversations", 9.99m, 60, "conversation"),
            ["conv-business"] = new("conv-business", "Business Conversations", 24.99m, 180, "conversation"),
            ["conv-enterprise"] = new("conv-enterprise", "Enterprise Conversations", 49.99m, 400, "conversation"),
            ["video-basic"] = new("video-basic", "Basic Image-to-Video", 39.99m, 100, "video"),
            ["video-standard"] = new("video-standard", "Standard Image-to-Video", 99.99m, 300, "video"),
            ["video-premium"] = new("video-premium", "Premium Image-to-Video", 199.99m, 800, "video"),
        }.ToImmutableDictionary();

    public static bool TryGetProduct(string productId, out ProductDefinition definition) =>
        _products.TryGetValue(productId, out definition!);

    public static IReadOnlyDictionary<string, ProductDefinition> All => _products;
}