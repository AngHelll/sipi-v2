#!/usr/bin/env ts-node
/**
 * Script to mark existing courses as completed by diagnostic exam
 * 
 * This script identifies courses that were created automatically by diagnostic exams
 * (courses with groupId = null, estatus = 'APROBADO', and no payment required)
 * and marks them with completadoPorDiagnostico = true
 * 
 * Usage: npx ts-node scripts/mark-diagnostic-courses.ts
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

async function markDiagnosticCourses() {
  console.log('\n🔍 Identifying courses completed by diagnostic exam...\n');

  try {
    // Find courses that match the pattern of diagnostic-completed courses:
    // - groupId is null (no real group)
    // - estatus is 'APROBADO' (approved)
    // - requierePago is false (no payment required)
    // - courseType is 'INGLES'
    const diagnosticCourses = await (prisma as any).special_courses.findMany({
      where: {
        courseType: 'INGLES',
        groupId: null,
        requierePago: false,
        aprobado: true,
        completadoPorDiagnostico: false, // Only update those not already marked
      },
      include: {
        academic_activities: {
          select: {
            id: true,
            estatus: true,
            studentId: true,
          },
        },
      },
    });

    // Filter to only those with APROBADO status
    const coursesToUpdate = diagnosticCourses.filter((course: any) => 
      course.academic_activities?.estatus === 'APROBADO'
    );

    console.log(`📊 Found ${coursesToUpdate.length} courses to mark as diagnostic-completed\n`);

    if (coursesToUpdate.length === 0) {
      console.log('✅ No courses need to be updated.\n');
      return;
    }

    // Update courses
    let updated = 0;
    for (const course of coursesToUpdate) {
      try {
        await (prisma as any).special_courses.update({
          where: { id: course.id },
          data: {
            completadoPorDiagnostico: true,
          },
        });
        updated++;
        console.log(`   ✅ Updated course ${course.id} (Activity: ${course.activityId})`);
      } catch (error: any) {
        console.error(`   ❌ Error updating course ${course.id}:`, error.message);
      }
    }

    console.log(`\n✅ Successfully updated ${updated} courses\n`);
    console.log('📋 Summary:');
    console.log(`   - Total courses found: ${coursesToUpdate.length}`);
    console.log(`   - Successfully updated: ${updated}`);
    console.log(`   - Failed: ${coursesToUpdate.length - updated}\n`);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

async function main() {
  try {
    await markDiagnosticCourses();
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();


