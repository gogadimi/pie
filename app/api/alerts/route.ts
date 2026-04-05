import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status'); // 'unread' or 'all'

  // TODO: Replace with DB query
  const alerts = [
    { id: '1', type: 'price_drop', severity: 'high', message: 'Amazon dropped MacBook price by 7.7%', timestamp: '2026-04-05 10:05', isRead: false },
    { id: '2', type: 'promo_detected', severity: 'medium', message: 'Best Buy flash sale on headphones', timestamp: '2026-04-05 09:30', isRead: false },
  ];

  const filtered = status === 'unread' ? alerts.filter(a => !a.isRead) : alerts;
  return NextResponse.json({ alerts: filtered });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { alertId, action } = body; // action: 'mark_read' | 'dismiss'

    // TODO: Update in DB
    return NextResponse.json({ success: true, action, alertId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
