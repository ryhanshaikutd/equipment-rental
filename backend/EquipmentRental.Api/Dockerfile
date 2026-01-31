# -------- Build stage --------
    FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
    WORKDIR /app
    
    # Copy csproj and restore
    COPY EquipmentRental.Api.csproj ./
    RUN dotnet restore
    
    # Copy everything else and build
    COPY . ./
    RUN dotnet publish -c Release -o out
    
    # -------- Runtime stage --------
    FROM mcr.microsoft.com/dotnet/aspnet:9.0
    WORKDIR /app
    COPY --from=build /app/out .
    
    # Render uses PORT env variable
    ENV ASPNETCORE_URLS=http://+:${PORT}
    
    EXPOSE 8080
    ENTRYPOINT ["dotnet", "EquipmentRental.Api.dll"]