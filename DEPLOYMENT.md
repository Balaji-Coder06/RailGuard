# RailGuard Free-Tier Production Deployment Guide

RailGuard is architected to run at **zero infrastructure cost** using modern cloud free tiers:

| Tier Component | Recommended Provider | Specs & Quota | Purpose |
|---|---|---|---|
| **Frontend UI** | **Vercel Hobby** | Unlimited deployments, 100GB bandwidth | React 19 + Vite SPA with Edge CDN |
| **CV Inference API** | **Hugging Face Spaces** | 2 vCPU, 16 GB RAM, 50GB storage | Containerized FastAPI + YOLO11s (CPU) |
| **Database & Images** | **Supabase Free** | 500 MB Postgres, 1 GB Storage | Persistent inspection records & image blobs |

---

## Free-Tier Operational Constraints & Trade-Offs

Before deploying to production, keep these operational limits in mind:

1. **Cold Boots & Inactivity Sleep:**
   - Hugging Face Spaces will automatically sleep after **48 hours** of zero incoming traffic.
   - The first request to a sleeping space will experience a **15–30 second cold start** while the container and weights spin up.
   - Subsequent inferences execute normally (~120–250ms on CPU).
2. **CPU Inference Latency:**
   - Free tier runs on **Intel Xeon CPU** without CUDA acceleration.
   - Single-image YOLO11s inference takes approximately **150–250ms**, compared to **8–15ms** on dedicated GPUs. This is normal and acceptable for demonstration and inspection audits.
3. **Database Inactivity Pause:**
   - Free Supabase projects pause after **7 days of inactivity**. Visiting the dashboard or running an inspection will resume the instance.

---

## Part 1: Deploying the FastAPI Backend to Hugging Face Spaces

### Step 1: Create a New Space
1. Log into [Hugging Face](https://huggingface.co).
2. Click your profile avatar &rarr; **New Space**.
3. Fill in:
   - **Space name**: `railguard-api`
   - **License**: `mit` or `openrail`
   - **Select the Space SDK**: Choose **Docker** &rarr; **Blank**.
   - **Space hardware**: `CPU Basic (2 vCPU · 16 GB)` — **Free**.
4. Click **Create Space**.

### Step 2: Push the RailGuard Backend Code
Clone your newly created Hugging Face Space repository locally or push this repository's backend files to it:

```bash
git remote add hf https://huggingface.co/spaces/YOUR_USERNAME/railguard-api
git push hf main
```

Ensure your Space includes:
- `Dockerfile` (located in repository root)
- `backend/` directory
- `backend/models/best.pt`
- `data.yaml`

The Dockerfile exposes port `7860`, which Hugging Face automatically routes to public HTTPS.

### Step 3: Verify Backend Health
Once the container finishes building, test the health endpoint:
```
https://YOUR_USERNAME-railguard-api.hf.space/api/health
```
You should receive:
```json
{
  "status": "healthy",
  "model_loaded": true,
  "model_path": "/app/backend/models/best.pt",
  "database_connected": true,
  "storage_type": "local",
  "version": "1.0.0"
}
```

---

## Part 2: Configuring Persistent PostgreSQL & Storage (Supabase)

If you wish to retain inspections across container rebuilds:

1. Create a free project at [supabase.com](https://supabase.com).
2. Under **Project Settings &rarr; Database**, copy the **Connection string (URI)**.
3. In Hugging Face Spaces &rarr; **Settings &rarr; Variables and secrets**:
   - Add Secret: `DATABASE_URL` = `postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres`
4. The backend's SQLAlchemy engine will automatically migrate the `inspections` and `detections` tables to Postgres on startup.

---

## Part 3: Deploying the React Frontend to Vercel

### Step 1: Connect Git Repository
1. Log into [Vercel](https://vercel.com).
2. Click **Add New &rarr; Project**.
3. Import your Git repository.

### Step 2: Configure Build Settings
- **Root Directory**: `frontend`
- **Framework Preset**: `Vite`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### Step 3: Set Environment Variables
Add the following Environment Variable in Vercel:

| Key | Value | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `https://YOUR_USERNAME-railguard-api.hf.space` | Public URL of your backend Space |

### Step 4: Deploy
Click **Deploy**. Vercel will build the SPA, bundle the Tailwind CSS stylesheets, and deploy across its global Edge network.

---

## Part 4: Local Development & Docker Compose

To test the entire containerized stack locally before deployment:

```bash
# Build and run backend + frontend together
docker-compose up --build
```

- Frontend: `http://localhost:5173`
- Backend API Docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/api/health`
