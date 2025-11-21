using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using AtendimentoMedico.Core.Application.Interfaces;
using AtendimentoMedico.Core.Application.Services;
using AtendimentoMedico.Core.Domain.Interfaces;
using AtendimentoMedico.Infrastructure.Persistence.Context;
using AtendimentoMedico.Infrastructure.Persistence.Repositories;

var builder = WebApplication.CreateBuilder(args);

// configuração do DbContext com SQL Server
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        sqlOptions => sqlOptions.EnableRetryOnFailure(
            maxRetryCount: 3,
            maxRetryDelay: TimeSpan.FromSeconds(5),
            errorNumbersToAdd: null
        )
    )
);

// DI - Repositórios
builder.Services.AddScoped<IPacienteRepository, PacienteRepository>();
builder.Services.AddScoped<IAtendimentoRepository, AtendimentoRepository>();
builder.Services.AddScoped<ITriagemRepository, TriagemRepository>();
builder.Services.AddScoped<IEspecialidadeRepository, EspecialidadeRepository>();

// DI - Serviços
builder.Services.AddScoped<IPacienteService, PacienteService>();
builder.Services.AddScoped<IAtendimentoService, AtendimentoService>();
builder.Services.AddScoped<ITriagemService, TriagemService>();
builder.Services.AddScoped<IEspecialidadeService, EspecialidadeService>();

// config controllers
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Sistema de Atendimento Médico API",
        Version = "v1",
        Description = "API REST para gerenciamento de fila de atendimento médico",
        Contact = new OpenApiContact
        {
            Name = "Aplicativo.net",
            Url = new Uri("https://aplicativo.net")
        }
    });

    var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
    {
        c.IncludeXmlComments(xmlPath);
    }
});

// Configuração de CORS (permite requisições do frontend)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
                "http://localhost:3000",  // React dev
                "http://localhost:4200",  // Angular dev
                "https://localhost:3000",
                "https://localhost:4200"
            )
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

// Logging
builder.Services.AddLogging(logging =>
{
    logging.ClearProviders();
    logging.AddConsole();
    logging.AddDebug();
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Sistema Atendimento API v1");
        c.RoutePrefix = string.Empty; // Swagger
    });
}
else
{
    app.UseExceptionHandler("/error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseCors("AllowFrontend");

app.UseAuthorization();

app.MapControllers();

app.MapGet("/health", () => Results.Ok(new
{
    status = "healthy",
    timestamp = DateTime.UtcNow,
    version = "1.0.0"
}));

if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var services = scope.ServiceProvider;
    
    try
    {
        var context = services.GetRequiredService<AppDbContext>();
        
        if (context.Database.GetPendingMigrations().Any())
        {
            Console.WriteLine("Aplicando migrations...");
            context.Database.Migrate();
            Console.WriteLine("Migrations aplicadas com sucesso!");
        }
        else
        {
            Console.WriteLine("Banco de dados atualizado!");
        }
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Erro ao aplicar migrations");
    }
}

Console.WriteLine("API iniciada com sucesso");
Console.WriteLine("Documentação Swagger: https://localhost:7000 ou http://localhost:5000");

app.Run();