# Deploy to Render

## Quick Deployment Steps

Your repository is ready for deployment on Render with both the backend API and Next.js frontend.

### 1. Go to Render Dashboard
Visit [https://dashboard.render.com](https://dashboard.render.com)

### 2. Create New Blueprint
- Click "New +" → "Blueprint"
- Connect your GitHub repository: `coa-solutions/pathpilot-oracle-fhir`
- Render will auto-detect the `render.yaml` file

### 3. Configure Services
The blueprint will create two services:
- **pathpilot-api**: Python FastAPI backend
- **pathpilot-frontend**: Next.js frontend

### 4. Update Environment Variables
After deployment, update these in the Render dashboard:

#### For pathpilot-api:
- `CORS_ORIGINS`: Update to match your frontend URL (e.g., `https://pathpilot-frontend-xyz.onrender.com`)

#### For pathpilot-frontend:
- `NEXT_PUBLIC_API_URL`: Update to match your backend URL (e.g., `https://pathpilot-api-xyz.onrender.com`)

### 5. Verify Deployment
Once deployed, you can access:
- Frontend: `https://pathpilot-frontend-[your-id].onrender.com`
- API Docs: `https://pathpilot-api-[your-id].onrender.com/docs`

## Service Details

### Backend API
- **Runtime**: Python 3.11
- **Framework**: FastAPI with Uvicorn
- **Data**: MIMIC-IV FHIR demo data (100 patients, 813K observations)
- **Endpoints**: Patient list, observations, diagnostic reports, patient intelligence

### Frontend
- **Runtime**: Node.js 18
- **Framework**: Next.js 15
- **Features**: Real-time lab dashboard, patient intelligence grid, critical alerts

## Troubleshooting

### If builds fail:
1. Check the build logs in Render dashboard
2. Ensure Git LFS files are properly tracked
3. Verify Python/Node versions match requirements

### If services can't communicate:
1. Verify CORS_ORIGINS includes the frontend URL
2. Check NEXT_PUBLIC_API_URL points to the backend
3. Ensure both services are running

## GitHub Repository
https://github.com/coa-solutions/pathpilot-oracle-fhir

## Local Development
```bash
# Clone with LFS support
git lfs clone https://github.com/coa-solutions/pathpilot-oracle-fhir.git

# Install and run
npm run install:deps
npm run dev
```

## Support
- Render Docs: https://render.com/docs
- Next.js on Render: https://render.com/docs/deploy-nextjs
- Python on Render: https://render.com/docs/deploy-fastapi