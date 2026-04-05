import { NextResponse } from 'next/server';
import { getHealthReport } from '@/lib/monitoring';

export async function GET() {
  const report = await getHealthReport();
  const statusCode = report.status === 'healthy' ? 200 : report.status === 'degraded' ? 200 : 503;
  return NextResponse.json(report, { status: statusCode });
}
