// Debug script to check exam periods availability
import { createPrismaClient } from '../src/config/create-prisma-client';

const prisma = createPrismaClient();

async function main() {
  console.log('\n🔍 DIAGNÓSTICO DE PERÍODOS DE EXÁMENES\n');
  console.log('═'.repeat(60));

  const now = new Date();
  console.log(`\n📅 Fecha/Hora actual: ${now.toISOString()}`);
  console.log(`📅 Fecha/Hora local: ${now.toLocaleString('es-MX')}\n`);

  // Get all periods
  const allPeriods = await (prisma as any).diagnostic_exam_periods.findMany({
    orderBy: { fechaInscripcionInicio: 'asc' },
  });

  console.log(`\n📊 TOTAL DE PERÍODOS EN BD: ${allPeriods.length}\n`);

  if (allPeriods.length === 0) {
    console.log('⚠️  No hay períodos creados en la base de datos');
    await prisma.$disconnect();
    return;
  }

  // Check each period
  for (const period of allPeriods) {
    console.log('─'.repeat(60));
    console.log(`\n📋 PERÍODO: ${period.nombre}`);
    console.log(`   ID: ${period.id}`);
    console.log(`   Estatus: ${period.estatus}`);
    console.log(`   DeletedAt: ${period.deletedAt || 'null'}`);
    console.log(`   Cupo Máximo: ${period.cupoMaximo}`);
    console.log(`   Cupo Actual: ${period.cupoActual}`);
    console.log(`   Cupos Disponibles: ${period.cupoMaximo - period.cupoActual}`);

    const fechaInscripcionInicio = new Date(period.fechaInscripcionInicio);
    const fechaInscripcionFin = new Date(period.fechaInscripcionFin);

    console.log(`\n   📅 Fechas de Inscripción:`);
    console.log(`      Inicio: ${fechaInscripcionInicio.toLocaleString('es-MX')}`);
    console.log(`      Fin: ${fechaInscripcionFin.toLocaleString('es-MX')}`);

    // Check conditions
    const isOpen = period.estatus === 'ABIERTO';
    const isNotDeleted = period.deletedAt === null;
    const isInRegistrationPeriod = now >= fechaInscripcionInicio && now <= fechaInscripcionFin;
    const hasCapacity = period.cupoMaximo > period.cupoActual;

    console.log(`\n   ✅ CONDICIONES:`);
    console.log(`      Estatus ABIERTO: ${isOpen ? '✅' : '❌'} (${period.estatus})`);
    console.log(`      No eliminado: ${isNotDeleted ? '✅' : '❌'}`);
    console.log(`      En período de inscripción: ${isInRegistrationPeriod ? '✅' : '❌'}`);
    console.log(`      Tiene cupo: ${hasCapacity ? '✅' : '❌'}`);

    const shouldBeAvailable = isOpen && isNotDeleted && isInRegistrationPeriod && hasCapacity;
    console.log(`\n   🎯 DISPONIBLE: ${shouldBeAvailable ? '✅ SÍ' : '❌ NO'}`);
  }

  // Check what the service would return
  console.log('\n' + '═'.repeat(60));
  console.log('\n🔍 QUERY DEL SERVICIO:\n');

  const availablePeriods = await (prisma as any).diagnostic_exam_periods.findMany({
    where: {
      estatus: 'ABIERTO',
      deletedAt: null,
      fechaInscripcionInicio: { lte: now },
      fechaInscripcionFin: { gte: now },
    },
    orderBy: {
      fechaInscripcionInicio: 'asc',
    },
  });

  console.log(`📊 PERÍODOS QUE DEVUELVE EL SERVICIO: ${availablePeriods.length}\n`);

  if (availablePeriods.length > 0) {
    availablePeriods.forEach((p: any) => {
      const cuposDisponibles = p.cupoMaximo - p.cupoActual;
      const estaDisponible = cuposDisponibles > 0;
      console.log(`   - ${p.nombre} (${p.id})`);
      console.log(`     Cupos disponibles: ${cuposDisponibles}/${p.cupoMaximo}`);
      console.log(`     estaDisponible: ${estaDisponible ? '✅' : '❌'}`);
    });
  } else {
    console.log('   ⚠️  No hay períodos que cumplan todos los criterios');
  }

  console.log('\n' + '═'.repeat(60) + '\n');

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('Error:', e);
  process.exit(1);
});

