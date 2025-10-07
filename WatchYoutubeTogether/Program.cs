using Microsoft.AspNetCore.StaticFiles;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using WatchYoutubeTogether;
using WatchYoutubeTogether.Services;
using WatchYoutubeTogether.Web_sockets_stuff;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IPosterService, PosterService>();

builder.Services.AddHostedService<BackgroundCleanupService>();

// Add SignalR services for real-time communication
builder.Services.AddSignalR();

builder.Services.AddDbContext<AppDbContext>(options =>
	options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(c =>
{
	c.SwaggerDoc("v1", new OpenApiInfo { Title = "My API", Version = "v1" });

	c.AddSecurityDefinition("accessToken", new OpenApiSecurityScheme
	{
		Description = "¬ÒÚ‡‚ÅEÅEaccess token (·ÂÅEBearer)",
		Name = "Authorization",
		In = ParameterLocation.Header,
		Type = SecuritySchemeType.ApiKey,
		Scheme = "accessToken"
	});

	c.AddSecurityRequirement(new OpenApiSecurityRequirement
	{
		{
			new OpenApiSecurityScheme
			{
				Reference = new OpenApiReference
				{
					Type = ReferenceType.SecurityScheme,
					Id = "accessToken"
				}
			},
			Array.Empty<string>()
		}
	});
});

builder.Services.AddCors(options =>
{
	// For REST API
	options.AddPolicy("Default", policy =>
	{
		policy
			.AllowAnyOrigin()
			.AllowAnyMethod()
			.AllowAnyHeader();
	});

	// For SignalR
	options.AddPolicy("SignalR", policy =>
	{
		policy
			.WithOrigins("http://localhost:5500", "http://127.0.0.1:5500", "http://localhost:5173", "https://localhost:7298")
			.AllowAnyHeader()
			.AllowAnyMethod()
			.AllowCredentials();
	});
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Enable CORS for the entire application
app.UseCors("Default");

// Enable CORS for SignalR endpoints
app.MapHub<WatchTogetherHub>("/watch").RequireCors("SignalR");

app.UseStaticFiles();

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
