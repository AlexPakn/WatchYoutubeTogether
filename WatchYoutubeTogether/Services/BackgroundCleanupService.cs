using Microsoft.EntityFrameworkCore;

namespace WatchYoutubeTogether.Services;

public class BackgroundCleanupService : BackgroundService
{
	private readonly IServiceProvider _serviceProvider;
	private readonly TimeSpan _interval = TimeSpan.FromHours(1); // can be adjusted as needed

	public BackgroundCleanupService(IServiceProvider serviceProvider)
	{
		_serviceProvider = serviceProvider;
	}

	protected override async Task ExecuteAsync(CancellationToken stoppingToken)
	{
		while (!stoppingToken.IsCancellationRequested)
		{
			try
			{
				using (var scope = _serviceProvider.CreateScope())
				{
					var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

					var now = DateTime.UtcNow;

					// Delete expired EmailConfirms
					await db.EmailConfirms
						.Where(c => c.ExpiryDate < now)
						.ExecuteDeleteAsync(stoppingToken);

					// Delete Users without a role and no EmailConfirm
					await db.Users
						.Where(u => u.Role == null &&
									!db.EmailConfirms.Any(c => c.UserEmail == u.Email))
						.ExecuteDeleteAsync(stoppingToken);

					// Delete expired RessetPasswords
					await db.RessetPasswords
						.Where(c => c.ExpiryDate < now)
						.ExecuteDeleteAsync(stoppingToken);

					// Delete expired UserTokens
					await db.UserTokens
						.Where(t => t.RefreshTokenExpiryTime < now)
						.ExecuteDeleteAsync(stoppingToken);


					await db.SaveChangesAsync(stoppingToken);
				}

				await Task.Delay(_interval, stoppingToken);
			}
			catch (Exception ex)
			{
				Console.WriteLine($"Error during cleanup: {ex.Message}");
			}
		}
	}
}
