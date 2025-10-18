import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import clientPromise from '@/lib/mongodb';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('recipe-manager');
    
    const user = await db.collection('users').findOne({ email });

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Mot de passe incorrect' },
        { status: 401 }
      );
    }

    // Retourner l'utilisateur sans le mot de passe
    return NextResponse.json({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
    });
  } catch (error) {
    console.error('Verify error:', error);
    return NextResponse.json(
      { error: 'Erreur de vérification' },
      { status: 500 }
    );
  }
}