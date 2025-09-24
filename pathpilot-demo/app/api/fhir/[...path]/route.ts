import { NextRequest, NextResponse } from 'next/server';

// Use MIMIC FHIR server from environment or default to local
const FHIR_BASE_URL = process.env.NEXT_PUBLIC_FHIR_BASE_URL || 'http://localhost:8000';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const path = resolvedParams.path.join('/');
    const searchParams = request.nextUrl.searchParams.toString();
    const url = `${FHIR_BASE_URL}/${path}${searchParams ? `?${searchParams}` : ''}`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json+fhir',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `FHIR API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('FHIR proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch FHIR data' },
      { status: 500 }
    );
  }
}