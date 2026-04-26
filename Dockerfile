# --------- 1. FASE DE DEPENDÈNCIES ---------
FROM node:24-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# --------- 2. FASE DE COMPILACIÓ ---------
FROM node:24-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Compilar el tipat de la base de dades abans de generar Next.js
RUN npx prisma generate
RUN npm run build

# --------- 3. FASE DE PRODUCCIÓ (Imatge Final) ---------
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV production

# Creem un usuari sense permisos
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiem el contingut ràpid de l'opció "standalone"
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000

# Executem el servidor compilat de Node, NO el 'npm run dev'!!
CMD ["node", "server.js"]
