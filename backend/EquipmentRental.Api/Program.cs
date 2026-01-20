var builder = WebApplication.CreateBuilder(args);


var allowedOrigin = "http://localhost:5173";

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

app.Run();

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}
