// Debug script to check why English courses are not showing as available
import prisma from '../src/config/database';

async function debugEnglishCourses() {
  const now = new Date();
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🔍 DIAGNÓSTICO DE CURSOS DE INGLÉS DISPONIBLES');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Fecha/Hora actual: ${now.toISOString()}\n`);

  // 1. Get ALL English courses (no filters)
  const allEnglishCourses = await prisma.groups.findMany({
    where: {
      esCursoIngles: true,
      deletedAt: null,
    },
    select: {
      id: true,
      nombre: true,
      esCursoIngles: true,
      estatus: true,
      fechaInscripcionInicio: true,
      fechaInscripcionFin: true,
      cupoActual: true,
      cupoMaximo: true,
      nivelIngles: true,
    },
    orderBy: {
      nombre: 'asc',
    },
  });

  console.log(`📊 Total de cursos de inglés encontrados: ${allEnglishCourses.length}\n`);

  if (allEnglishCourses.length === 0) {
    console.log('❌ No se encontraron cursos de inglés en la base de datos.');
    console.log('   Verifica que hayas creado cursos con esCursoIngles = true\n');
    await prisma.$disconnect();
    return;
  }

  // 2. Analyze each course
  allEnglishCourses.forEach((course, index) => {
    console.log(`\n${index + 1}. ${course.nombre}`);
    console.log('   ──────────────────────────────────────────────────────');
    
    // Check esCursoIngles
    const isEnglishCourse = course.esCursoIngles === true;
    console.log(`   ✓ esCursoIngles: ${course.esCursoIngles} ${isEnglishCourse ? '✅' : '❌'}`);
    
    // Check estatus
    const isOpen = course.estatus === 'ABIERTO';
    console.log(`   ${isOpen ? '✓' : '✗'} estatus: ${course.estatus} ${isOpen ? '✅' : '❌ (debe ser ABIERTO)'}`);
    
    // Check dates
    const hasStartDate = course.fechaInscripcionInicio !== null;
    const hasEndDate = course.fechaInscripcionFin !== null;
    const startDateValid = !hasStartDate || course.fechaInscripcionInicio! <= now;
    const endDateValid = !hasEndDate || course.fechaInscripcionFin! >= now;
    
    console.log(`   ${hasStartDate ? '✓' : '○'} fechaInscripcionInicio: ${course.fechaInscripcionInicio?.toISOString() || 'NULL (siempre disponible)'} ${startDateValid ? '✅' : '❌'}`);
    console.log(`   ${hasEndDate ? '✓' : '○'} fechaInscripcionFin: ${course.fechaInscripcionFin?.toISOString() || 'NULL (nunca cierra)'} ${endDateValid ? '✅' : '❌'}`);
    
    // Check capacity
    const hasCapacity = course.cupoActual < course.cupoMaximo;
    console.log(`   ${hasCapacity ? '✓' : '✗'} cupos: ${course.cupoActual}/${course.cupoMaximo} ${hasCapacity ? '✅' : '❌ (LLENO)'}`);
    
    // Check nivelIngles
    console.log(`   ○ nivelIngles: ${course.nivelIngles || 'NULL'}`);
    
    // Overall status
    const isAvailable = isEnglishCourse && isOpen && startDateValid && endDateValid && hasCapacity;
    console.log(`   ${isAvailable ? '✅' : '❌'} DISPONIBLE: ${isAvailable ? 'SÍ' : 'NO'}`);
    
    if (!isAvailable) {
      console.log('   ⚠️  Razones por las que NO está disponible:');
      if (!isEnglishCourse) console.log('      - No está marcado como curso de inglés');
      if (!isOpen) console.log(`      - Estatus es "${course.estatus}" (debe ser "ABIERTO")`);
      if (!startDateValid) console.log(`      - fechaInscripcionInicio es futura: ${course.fechaInscripcionInicio?.toISOString()}`);
      if (!endDateValid) console.log(`      - fechaInscripcionFin es pasada: ${course.fechaInscripcionFin?.toISOString()}`);
      if (!hasCapacity) console.log(`      - Sin cupos disponibles (${course.cupoActual}/${course.cupoMaximo})`);
    }
  });

  // 3. Test the actual query
  console.log('\n\n═══════════════════════════════════════════════════════════');
  console.log('🔍 PRUEBA DE CONSULTA ACTUAL');
  console.log('═══════════════════════════════════════════════════════════\n');

  const whereClause: any = {
    esCursoIngles: true,
    estatus: 'ABIERTO',
    deletedAt: null,
    AND: [
      {
        OR: [
          { fechaInscripcionInicio: null },
          { fechaInscripcionInicio: { lte: now } },
        ],
      },
      {
        OR: [
          { fechaInscripcionFin: null },
          { fechaInscripcionFin: { gte: now } },
        ],
      },
    ],
  };

  const queryResults = await prisma.groups.findMany({
    where: whereClause,
    select: {
      id: true,
      nombre: true,
      cupoActual: true,
      cupoMaximo: true,
    },
  });

  console.log(`📊 Cursos que pasan el filtro de fechas: ${queryResults.length}`);
  queryResults.forEach(course => {
    const hasCapacity = course.cupoActual < course.cupoMaximo;
    console.log(`   ${hasCapacity ? '✅' : '❌'} ${course.nombre} (${course.cupoActual}/${course.cupoMaximo}) ${hasCapacity ? '' : '[LLENO]'}`);
  });

  // 4. Final available courses (with capacity filter)
  const finalAvailable = queryResults.filter(c => c.cupoActual < c.cupoMaximo);
  console.log(`\n✅ Cursos FINALES disponibles (con cupos): ${finalAvailable.length}`);

  await prisma.$disconnect();
}

debugEnglishCourses().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});


