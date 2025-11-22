using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using AtendimentoMedico.Core.Application.Interfaces;
using AtendimentoMedico.Core.Application.Services;
using AtendimentoMedico.Core.Domain.Interfaces;
using AtendimentoMedico.Infrastructure.Persistence.Context;
using AtendimentoMedico.Infrastructure.Persistence.Repositories;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    
    if (string.IsNullOrEmpty(connectionString))
    {
        throw new InvalidOperationException(
            "Connection string 'DefaultConnection' não encontrada" +
            "Verifique o arquivo appsettings.json");
    }

    options.UseSqlServer(connectionString, sqlOptions =>
    {
        sqlOptions.EnableRetryOnFailure(
            maxRetryCount: 3,
            maxRetryDelay: TimeSpan.FromSeconds(5),
            errorNumbersToAdd: null
        );
        sqlOptions.CommandTimeout(30);
    });

    // habilita logging detalhado apenas em desenvolvimento
    if (builder.Environment.IsDevelopment())
    {
        options.EnableSensitiveDataLogging();
        options.EnableDetailedErrors();
    }
});

// DI para repositorios
builder.Services.AddScoped<IPacienteRepository, PacienteRepository>();
builder.Services.AddScoped<IAtendimentoRepository, AtendimentoRepository>();
builder.Services.AddScoped<ITriagemRepository, TriagemRepository>();
builder.Services.AddScoped<IEspecialidadeRepository, EspecialidadeRepository>();

// DI para servicos
builder.Services.AddScoped<IPacienteService, PacienteService>();
builder.Services.AddScoped<IAtendimentoService, AtendimentoService>();
builder.Services.AddScoped<ITriagemService, TriagemService>();
builder.Services.AddScoped<IEspecialidadeService, EspecialidadeService>();

// config de controllers
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = 
            System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.PropertyNamingPolicy = 
            System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.DefaultIgnoreCondition = 
            System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
    });

// swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Sistema de Atendimento Médico API",
        Version = "v1",
        Description = "API REST para gerenciamento de fila de atendimento médico com triagem",
        Contact = new OpenApiContact
        {
            Name = "Aplicativo.net",
            Email = "contato@aplicativo.net",
            Url = new Uri("https://aplicativo.net")
        }
    });

    var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
    {
        c.IncludeXmlComments(xmlPath);
    }

    c.OrderActionsBy(x => x.RelativePath);
});

// cors
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
                "http://localhost:3000",      // React dev
                "http://localhost:4200",      // Angular dev
                "https://localhost:3000",
                "https://localhost:4200",
                "http://localhost:5173",      // Vite
                "https://localhost:5173"
            )
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });

    if (builder.Environment.IsDevelopment())
    {
        options.AddPolicy("AllowAll", policy =>
        {
            policy.AllowAnyOrigin()
                .AllowAnyMethod()
                .AllowAnyHeader();
        });
    }
});

// logs
builder.Services.AddLogging(logging =>
{
    logging.ClearProviders();
    logging.AddConsole();
    logging.AddDebug();
    
    if (builder.Environment.IsDevelopment())
    {
        logging.SetMinimumLevel(LogLevel.Debug);
    }
    else
    {
        logging.SetMinimumLevel(LogLevel.Information);
    }
});

var app = builder.Build();

// middleware

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Sistema Atendimento API v1");
        c.RoutePrefix = string.Empty; // Swagger na raiz
        c.DocumentTitle = "API Atendimento Médico";
    });
    
    // migrations ambiente dev
    await AplicarMigrationsAsync(app);
}
else
{
    app.UseExceptionHandler("/error");
    app.UseHsts();
}

app.UseHttpsRedirection();

if (app.Environment.IsDevelopment())
{
    app.UseCors("AllowAll");
}
else
{
    app.UseCors("AllowFrontend");
}

app.UseAuthorization();

app.MapControllers();


app.MapHealthChecks("/health");

app.MapGet("/api/info", () => Results.Ok(new
{
    nome = "Sistema de Atendimento Médico API",
    versao = "1.0.0",
    ambiente = app.Environment.EnvironmentName,
    timestamp = DateTime.UtcNow,
    status = "online"
}))
.WithName("ApiInfo")
.WithTags("Info");

app.MapGet("/error", () => Results.Problem("Ocorreu um erro no servidor"))
    .ExcludeFromDescription();

var logger = app.Services.GetRequiredService<ILogger<Program>>();
logger.LogInformation("========================================");
logger.LogInformation("API INICIADA COM SUCESSO");
logger.LogInformation("Ambiente: {Ambiente}", app.Environment.EnvironmentName);
logger.LogInformation("Swagger: {SwaggerUrl}", app.Environment.IsDevelopment() ? "https://localhost:7106" : "Desabilitado");
logger.LogInformation("========================================");

app.Run();

async Task AplicarMigrationsAsync(WebApplication app)
{
    using var scope = app.Services.CreateScope();
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();

    try
    {
        var context = services.GetRequiredService<AppDbContext>();
        
        logger.LogInformation("Verificando migrations pendentes...");
        
        var pendingMigrations = await context.Database.GetPendingMigrationsAsync();
        
        if (pendingMigrations.Any())
        {
            logger.LogWarning("Aplicando {Count} migrations pendentes...", pendingMigrations.Count());
            
            foreach (var migration in pendingMigrations)
            {
                logger.LogInformation("  - {Migration}", migration);
            }
            
            await context.Database.MigrateAsync();
            logger.LogInformation("✓ Migrations aplicadas com sucesso!");
        }
        else
        {
            logger.LogInformation("✓ Banco de dados está atualizado!");
        }

        // Verificar conexão
        var canConnect = await context.Database.CanConnectAsync();
        if (canConnect)
        {
            logger.LogInformation("✓ Conexão com banco de dados OK!");
        }
        else
        {
            logger.LogError("✗ Não foi possível conectar ao banco de dados!");
        }
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "✗ Erro ao aplicar migrations ou conectar ao banco de dados");
        logger.LogWarning("A aplicação continuará, mas pode não funcionar corretamente.");
    }
}