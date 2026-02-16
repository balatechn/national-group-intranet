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

// GET - List user's chat rooms with last message & unread count
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const memberships = await prisma.chatMember.findMany({
      where: { userId: user.id },
      include: {
        room: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    displayName: true,
                    avatar: true,
                    lastActiveAt: true,
                  },
                },
              },
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: {
                sender: {
                  select: { id: true, firstName: true, lastName: true },
                },
              },
            },
          },
        },
      },
      orderBy: { room: { updatedAt: 'desc' } },
    });

    const rooms = memberships.map((m) => {
      const lastMessage = m.room.messages[0] || null;
      const otherMembers = m.room.members
        .filter((mb) => mb.userId !== user.id)
        .map((mb) => mb.user);

      // Count unread messages
      const unreadCount = lastMessage && lastMessage.createdAt > m.lastReadAt ? 1 : 0;

      return {
        id: m.room.id,
        name: m.room.isGroup ? m.room.name : null,
        isGroup: m.room.isGroup,
        otherMembers,
        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              content: lastMessage.content,
              senderId: lastMessage.senderId,
              senderName: `${lastMessage.sender.firstName} ${lastMessage.sender.lastName}`,
              createdAt: lastMessage.createdAt,
            }
          : null,
        unreadCount,
        updatedAt: m.room.updatedAt,
      };
    });

    // Sort: rooms with recent messages first
    rooms.sort((a, b) => {
      const aTime = a.lastMessage?.createdAt || a.updatedAt;
      const bTime = b.lastMessage?.createdAt || b.updatedAt;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });

    return NextResponse.json({ rooms });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create or get a direct message room with a user
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { targetUserId } = await request.json();

    if (!targetUserId) {
      return NextResponse.json({ error: 'targetUserId is required' }, { status: 400 });
    }

    if (targetUserId === user.id) {
      return NextResponse.json({ error: 'Cannot chat with yourself' }, { status: 400 });
    }

    // Check if DM room already exists between these two users
    const existingRoom = await prisma.chatRoom.findFirst({
      where: {
        isGroup: false,
        AND: [
          { members: { some: { userId: user.id } } },
          { members: { some: { userId: targetUserId } } },
        ],
        members: { every: { userId: { in: [user.id, targetUserId] } } },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                displayName: true,
                avatar: true,
                lastActiveAt: true,
              },
            },
          },
        },
      },
    });

    if (existingRoom) {
      return NextResponse.json({ room: existingRoom });
    }

    // Create new DM room
    const newRoom = await prisma.chatRoom.create({
      data: {
        isGroup: false,
        members: {
          create: [
            { userId: user.id },
            { userId: targetUserId },
          ],
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                displayName: true,
                avatar: true,
                lastActiveAt: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ room: newRoom });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
