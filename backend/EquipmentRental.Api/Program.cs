using System.Text.Json;
using System.Net.Http.Json;
var builder = WebApplication.CreateBuilder(args);


var allowedOrigin = "http://localhost:5174";

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendDev", policy =>
    {
        policy.WithOrigins(allowedOrigin)
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});


builder.Services.AddOpenApi();

var app = builder.Build();
app.UseCors("FrontendDev");


if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}
app.UseHttpsRedirection();

var summaries = new[]
{
    "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
};

app.MapGet("/weatherforecast", () =>
{
    var forecast =  Enumerable.Range(1, 5).Select(index =>
        new WeatherForecast
        (
            DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
            Random.Shared.Next(-20, 55),
            summaries[Random.Shared.Next(summaries.Length)]
        ))
        .ToArray();
    return forecast;
})
.WithName("GetWeatherForecast");

app.MapGet("/health", () => Results.Ok(new { status = "ok" }));


app.MapGet("/items", async (IConfiguration config) =>
{
    var supabaseUrl = config["Supabase:Url"];
    var anonKey = config["Supabase:AnonKey"];

    if (string.IsNullOrWhiteSpace(supabaseUrl) || string.IsNullOrWhiteSpace(anonKey))
    {
        return Results.Problem("Supabase settings missing. Check appsettings.Development.json.");
    }

    var url = $"{supabaseUrl}/rest/v1/items?select=*";

    using var http = new HttpClient();
    http.DefaultRequestHeaders.Add("apikey", anonKey);
    http.DefaultRequestHeaders.Add("Authorization", $"Bearer {anonKey}");

    var response = await http.GetAsync(url);
    var body = await response.Content.ReadAsStringAsync();

    return Results.Text(body, "application/json");
});

app.MapGet("/items/{id:long}", async (long id, IConfiguration config) =>
{
    var supabaseUrl = config["Supabase:Url"];
    var anonKey = config["Supabase:AnonKey"];

    if (string.IsNullOrWhiteSpace(supabaseUrl) || string.IsNullOrWhiteSpace(anonKey))
    {
        return Results.Problem("Supabase settings missing.");
    }

    var url = $"{supabaseUrl}/rest/v1/items?select=*&id=eq.{id}";

    using var http = new HttpClient();
    http.DefaultRequestHeaders.Add("apikey", anonKey);
    http.DefaultRequestHeaders.Add("Authorization", $"Bearer {anonKey}");

    var response = await http.GetAsync(url);
    var body = await response.Content.ReadAsStringAsync();

    using var doc = JsonDocument.Parse(body);

    if (doc.RootElement.GetArrayLength() == 0)
    {
        return Results.NotFound();
    }

    var itemJson = doc.RootElement[0].GetRawText();
    return Results.Text(itemJson, "application/json");
});

app.MapPatch("/items/{itemId:long}/image", async (
    long itemId,
    UpdateItemImageRequest request,
    IConfiguration config
) =>
{
    var supabaseUrl = config["Supabase:Url"];
    var anonKey = config["Supabase:AnonKey"];

    if (string.IsNullOrWhiteSpace(supabaseUrl) || string.IsNullOrWhiteSpace(anonKey))
    {
        return Results.Problem("Supabase settings missing. Check appsettings.Development.json.");
    }

    if (request is null || string.IsNullOrWhiteSpace(request.image_path))
    {
        return Results.BadRequest(new { message = "image_path is required." });
    }

    // Update the row with id = itemId
    var url = $"{supabaseUrl}/rest/v1/items?id=eq.{itemId}";

    using var http = new HttpClient();
    http.DefaultRequestHeaders.Add("apikey", anonKey);
    http.DefaultRequestHeaders.Add("Authorization", $"Bearer {anonKey}");

    // Supabase expects JSON for the fields you want to update
    var payload = JsonContent.Create(new { image_path = request.image_path });

    // PATCH to Supabase REST
    var response = await http.PatchAsync(url, payload);

    if (!response.IsSuccessStatusCode)
    {
        var body = await response.Content.ReadAsStringAsync();
        return Results.Problem($"Failed to update item image. Supabase said: {body}");
    }

    return Results.NoContent();
});

app.MapGet("/items/{itemId}/booked-ranges", async (long itemId, IConfiguration config) =>
{
    var supabaseUrl = config["Supabase:Url"];
    var anonKey = config["Supabase:AnonKey"];

    if (string.IsNullOrWhiteSpace(supabaseUrl) || string.IsNullOrWhiteSpace(anonKey))
    {
        return Results.Problem("Supabase settings missing. Check appsettings.Development.json.");
    }

    // Supabase filter: item_id equals this itemId
    var url = $"{supabaseUrl}/rest/v1/reservations?select=start_date,end_date&item_id=eq.{itemId}";

    using var http = new HttpClient();
    http.DefaultRequestHeaders.Add("apikey", anonKey);
    http.DefaultRequestHeaders.Add("Authorization", $"Bearer {anonKey}");

    var response = await http.GetAsync(url);
    var body = await response.Content.ReadAsStringAsync();

    return Results.Text(body, "application/json");
});

app.MapPost("/reservations", async (
    CreateReservationRequest request,
    IConfiguration config
) =>
{
    var supabaseUrl = config["Supabase:Url"];
    var anonKey = config["Supabase:AnonKey"];

    if (string.IsNullOrWhiteSpace(supabaseUrl) || string.IsNullOrWhiteSpace(anonKey))
    {
        return Results.Problem("Supabase settings missing. Check appsettings.Development.json.");
    }

    if (request is null)
    {
        return Results.BadRequest(new { message = "Request body is required." });
    }

    if (string.IsNullOrWhiteSpace(request.renter_name) || string.IsNullOrWhiteSpace(request.renter_email))
    {
        return Results.BadRequest(new { message = "Name and email are required." });
    }

    if (request.end_date < request.start_date)
    {
        return Results.BadRequest(new { message = "end_date must be >= start_date." });
    }

    using var http = new HttpClient();
    http.DefaultRequestHeaders.Add("apikey", anonKey);
    http.DefaultRequestHeaders.Add("Authorization", $"Bearer {anonKey}");

    // 1) Overlap check:
    // overlap exists if requestedStart <= existingEnd AND requestedEnd >= existingStart
    var overlapUrl =
        $"{supabaseUrl}/rest/v1/reservations" +
        $"?select=id" +
        $"&item_id=eq.{request.item_id}" +
        $"&start_date=lte.{request.end_date:yyyy-MM-dd}" +
        $"&end_date=gte.{request.start_date:yyyy-MM-dd}" +
        $"&limit=1";

    var overlapRes = await http.GetAsync(overlapUrl);
    var overlapBody = await overlapRes.Content.ReadAsStringAsync();

    if (!overlapRes.IsSuccessStatusCode)
    {
        return Results.Problem($"Failed to check availability. Supabase said: {overlapBody}");
    }

    using var overlapDoc = JsonDocument.Parse(overlapBody);
    if (overlapDoc.RootElement.GetArrayLength() > 0)
    {
        return Results.Conflict(new { message = "Dates overlap an existing reservation." });
    }

    // 2) Price calc (simple per-day, inclusive)
    var days = (request.end_date.DayNumber - request.start_date.DayNumber) + 1;
    if (days <= 0) days = 1;

    // Fetch daily_price for item
    var itemUrl = $"{supabaseUrl}/rest/v1/items?select=daily_price&id=eq.{request.item_id}&limit=1";
    var itemRes = await http.GetAsync(itemUrl);
    var itemBody = await itemRes.Content.ReadAsStringAsync();

    if (!itemRes.IsSuccessStatusCode)
    {
        return Results.Problem($"Failed to fetch item price. Supabase said: {itemBody}");
    }

    using var itemDoc = JsonDocument.Parse(itemBody);
    if (itemDoc.RootElement.GetArrayLength() == 0)
    {
        return Results.NotFound(new { message = "Item not found." });
    }

    var dailyPrice = itemDoc.RootElement[0].GetProperty("daily_price").GetDecimal();
    var totalPrice = dailyPrice * days;

    // 3) Insert reservation
    var insertUrl = $"{supabaseUrl}/rest/v1/reservations";

    var insertPayload = JsonContent.Create(new
    {
        item_id = request.item_id,
        start_date = request.start_date.ToString("yyyy-MM-dd"),
        end_date = request.end_date.ToString("yyyy-MM-dd"),
        renter_name = request.renter_name,
        renter_email = request.renter_email,
        total_price = totalPrice
    });

    // Ask Supabase to return the inserted row
    var insertReq = new HttpRequestMessage(HttpMethod.Post, insertUrl)
    {
        Content = insertPayload
    };
    insertReq.Headers.Add("Prefer", "return=representation");

    var insertRes = await http.SendAsync(insertReq);
    var insertBody = await insertRes.Content.ReadAsStringAsync();

    if (!insertRes.IsSuccessStatusCode)
    {
        return Results.Problem($"Failed to create reservation. Supabase said: {insertBody}");
    }

    return Results.Text(insertBody, "application/json");
});

app.Run();

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}

record UpdateItemImageRequest(string image_path);

record CreateReservationRequest(
    long item_id,
    DateOnly start_date,
    DateOnly end_date,
    string renter_name,
    string renter_email
);
