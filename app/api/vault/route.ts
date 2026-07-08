import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { CareerVault } from "@/models/CareerVault";

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id") || "mock-user-123";
    await connectToDatabase();
    
    let vault = await CareerVault.findOne({ userId });
    if (!vault) {
      // Create empty vault default record
      vault = new CareerVault({ 
        userId,
        skills: [],
        experience: [],
        projects: [],
        education: [],
        certifications: [],
        achievements: [],
        languages: []
      });
      await vault.save();
    }
    
    return NextResponse.json({ success: true, data: vault });
  } catch (error: any) {
    console.error("GET vault error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch vault" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id") || "mock-user-123";
    const body = await request.json();
    
    await connectToDatabase();
    let vault = await CareerVault.findOne({ userId });
    
    if (!vault) {
      vault = new CareerVault({ userId, ...body });
    } else {
      // Sync keys manually
      vault.skills = body.skills || [];
      vault.experience = body.experience || [];
      vault.projects = body.projects || [];
      vault.education = body.education || [];
      vault.certifications = body.certifications || [];
      vault.achievements = body.achievements || [];
      vault.languages = body.languages || [];
      // New sections
      vault.hackathons = body.hackathons || [];
      vault.leadership = body.leadership || [];
      vault.publications = body.publications || [];
      vault.volunteering = body.volunteering || [];
      vault.updatedAt = new Date();
    }
    
    await vault.save();
    return NextResponse.json({ success: true, data: vault });
  } catch (error: any) {
    console.error("POST vault error:", error);
    return NextResponse.json({ error: error.message || "Failed to save vault" }, { status: 500 });
  }
}
