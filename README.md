# Watch Youtube Together

## Installation & Setup Guide

Follow these steps to set up and run the Watch Youtube Together project on a new PC.

### Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Visual Studio 2022](https://visualstudio.microsoft.com/vs/) (or later) with ASP.NET and web development workload
- [PostgreSQL](https://www.postgresql.org/download/)
- [Node.js](https://nodejs.org/) (optional, for frontend tooling or Live Server extension)

### Steps

1. **Download from GIT**

- download this project to your desired location.

2. **Update Configuration**

- Create `appsettings.json` and create the database connection string to match your PostgreSQL setup.
- Create the SMTP email settings with your own credentials to enable email sending.


3. **Database Setup**

- Before applying migrations, install the EF Core CLI tools (if not already installed):

```sh
dotnet tool install --global dotnet-ef
```
- Apply migrations (if using Entity Framework):

```sh
dotnet ef database update
```

4. **Build the Project**


5. **Run the Server**


- The API will be available at the URL shown in the console (typically `http://localhost:5501` or similar).

- After running, API docs are available at: `http://localhost:5501/swagger` (or the port shown in your console).

### "Watch Youtube Together" (`youtube_api_test.html`)

- The file `youtube_api_test.html` **must not be opened directly as a local file** (e.g., `file:///C:/.../...test.html`), as browser security restrictions will prevent it from working correctly.
- **Recommended:** Use a local web server to serve the file. For example, with the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension in Visual Studio Code:
1. Open the folder containing `youtube_api_test.html` in VS Code.
2. In the bottom right press the button **"Go Live"**.
3. The file will open in your browser at `http://localhost:PORT/...test.html`.

- Alternatively, you can use any other static file server (e.g. `npx serve`, Python's `http.server`, etc.).

- CORS is configured for http://localhost:5500 and http://127.0.0.1:5500. If you use a different port, you should update the CORS policy in Program.cs.

### Additional Notes


- Ensure all environment variables and configuration files are set up as required for your environment.
- For any issues, check the project documentation.

---
