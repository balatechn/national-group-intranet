import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const JWT_SECRET = new TextEncoder().encode(
  process.env.WORKOS_COOKIE_PASSWORD || process.env.NEXTAUTH_SECRET || 'your-secret-key-min-32-chars-long!!'
);
const COOKIE_NAME = 'workos_session';

async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const session = payload.session as any;
    return session?.user || null;
  } catch {
    return null;
  }
}

// GET - Fetch messages for a room
export async function GET(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { roomId } = params;
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Verify user is a member of this room
    const membership = await prisma.chatMember.findUnique({
      where: { userId_roomId: { userId: user.id, roomId } },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this room' }, { status: 403 });
    }

    const messages = await prisma.chatMessage.findMany({
      where: { roomId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            displayName: true,
            avatar: true,
          },
        },
      },
    });

    // Mark as read
    await prisma.chatMember.update({
      where: { userId_roomId: { userId: user.id, roomId } },
      data: { lastReadAt: new Date() },
    });

    return NextResponse.json({
      messages: messages.reverse(),
      hasMore: messages.length === limit,
      cursor: messages.length > 0 ? messages[0].id : null,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Send a message
export async function POST(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { roomId } = params;
    const { content } = await request.json();

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    // Verify membership
    const membership = await prisma.chatMember.findUnique({
      where: { userId_roomId: { userId: user.id, roomId } },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this room' }, { status: 403 });
    }

    // Create message and update room timestamp
    const [message] = await prisma.$transaction([
      prisma.chatMessage.create({
        data: {
          content: content.trim(),
          senderId: user.id,
          roomId,
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              displayName: true,
              avatar: true,
            },
          },
        },
      }),
      prisma.chatRoom.update({
        where: { id: roomId },
        data: { updatedAt: new Date() },
      }),
      prisma.chatMember.update({
        where: { userId_roomId: { userId: user.id, roomId } },
        data: { lastReadAt: new Date() },
      }),
    ]);

    return NextResponse.json({ message });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
