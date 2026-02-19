import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/workos-auth';

// GET - Serve the current user's avatar image
export async function GET(request: NextRequest) {
  try {
    // Check for userId query param (for other users' avatars)
    const userId = request.nextUrl.searchParams.get('userId');
    
    let targetUserId: string;
    if (userId) {
      targetUserId = userId;
    } else {
      const sessionUser = await getSessionUser();
      if (!sessionUser?.id) {
        return new NextResponse(null, { status: 401 });
      }
      targetUserId = sessionUser.id;
    }

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { avatar: true },
    });

    if (!user?.avatar) {
      return new NextResponse(null, { status: 404 });
    }

    // If it's a base64 data URL, extract and serve as image
    const match = user.avatar.match(/^data:(image\/\w+);base64,(.+)$/);
    if (match) {
      const contentType = match[1];
      const base64Data = match[2];
      const buffer = Buffer.from(base64Data, 'base64');
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        },
      });
    }

    // If it's a URL, redirect to it
    return NextResponse.redirect(user.avatar);
  } catch (error) {
    console.error('Avatar fetch error:', error);
    return new NextResponse(null, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('avatar') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 2MB.' },
        { status: 400 }
      );
    }

    // Convert to base64 data URL
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    // Update user avatar
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { avatar: dataUrl },
      select: { id: true, avatar: true },
    });

    return NextResponse.json({ success: true, avatar: updated.avatar });
  } catch (error) {
    console.error('Avatar upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload avatar' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { avatar: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Avatar delete error:', error);
    return NextResponse.json(
      { error: 'Failed to remove avatar' },
      { status: 500 }
    );
  }
}
