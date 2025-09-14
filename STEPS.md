## 🚀 Setup folder structure using nx (main folder name - shopverse)

```sh
npx create-nx-workspace@latest .

# It's not gonna create a new folder inside shopverse

=> In this set our base(first service) application name like - auth-service, order-service etc....

/apps
    - /auth-service
    - /auth-service-e2e
```

```sh
# For Create an another services

nx add @nx/express

nx g @nx/express:app api-gateway --directory=apps/api-gateway --e2eTestRunner=none
```
