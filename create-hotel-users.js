// create-hotel-users.js - Script para crear todos los tipos de usuarios del Hotel Mar Azul
const axios = require('axios');

class HotelUsersCreator {
  constructor(baseURL = 'http://localhost:5000') {
    this.baseURL = baseURL;
    this.token = null;
    
    // 🏨 USUARIOS DEL HOTEL A CREAR
    this.hotelUsers = [
      // 👤 ADMINISTRADOR (ya existe por defecto, solo lo verificamos)
      {
        first_name: "Alexander",
        last_name: "Echeverria",
        email: "admin@hotelmarazul.com",
        username: "admin",
        password: "Admin123!",
        phone: "+502 7940-0001",
        role: "admin",
        language: "es",
        isDefault: true
      },
      
      // 👔 GERENTE
      {
        first_name: "Ana",
        last_name: "Morales",
        email: "ana.morales@hotelmarazul.com",
        username: "anamorales",
        password: "Manager123!",
        phone: "+502 7940-0002",
        role: "manager",
        language: "es"
      },
      
      // 📋 RECEPCIONISTA 1
      {
        first_name: "Carlos",
        last_name: "Hernández",
        email: "carlos.hernandez@hotelmarazul.com",
        username: "chernandez",
        password: "Recepcion123!",
        phone: "+502 7940-0003",
        role: "receptionist",
        language: "es"
      },
      
      // 📋 RECEPCIONISTA 2
      {
        first_name: "María",
        last_name: "López",
        email: "maria.lopez@hotelmarazul.com",
        username: "mlopez",
        password: "Recepcion456!",
        phone: "+502 7940-0004",
        role: "receptionist",
        language: "es"
      },
      
      // 🧹 PERSONAL DE LIMPIEZA 1
      {
        first_name: "Rosa",
        last_name: "García",
        email: "rosa.garcia@hotelmarazul.com",
        username: "rgarcia",
        password: "Limpieza123!",
        phone: "+502 7940-0005",
        role: "cleaning",
        language: "es"
      },
      
      // 🧹 PERSONAL DE LIMPIEZA 2
      {
        first_name: "Pedro",
        last_name: "Mendoza",
        email: "pedro.mendoza@hotelmarazul.com",
        username: "pmendoza",
        password: "Limpieza456!",
        phone: "+502 7940-0006",
        role: "cleaning",
        language: "es"
      },
      
      // 🏖️ HUÉSPED 1
      {
        first_name: "Isabella",
        last_name: "Johnson",
        email: "isabella.johnson@gmail.com",
        username: "ijohnson",
        password: "Guest123!",
        phone: "+1 555-0001",
        role: "guest",
        language: "en"
      },
      
      // 🏖️ HUÉSPED 2
      {
        first_name: "Roberto",
        last_name: "Silva",
        email: "roberto.silva@hotmail.com",
        username: "rsilva",
        password: "Huesped123!",
        phone: "+502 5555-0002",
        role: "guest",
        language: "es"
      }
    ];
    
    this.createdUsers = [];
  }

  async runCreation() {
    console.log('🏨 Hotel Mar Azul - Script para crear usuarios del sistema\n');
    
    try {
      await this.checkServer();
      await this.loginAdmin();
      await this.createAllUsers();
      await this.verifyUsers();
      await this.testUserLogins();
      
      console.log('\n✅ ¡Usuarios del hotel creados exitosamente!');
      this.showSummary();
      
    } catch (error) {
      console.error('\n❌ Error:', error.message);
      if (error.response) {
        console.error('📋 Detalles:', error.response.data);
      }
      process.exit(1);
    }
  }

  async checkServer() {
    console.log('1. 🏥 Verificando servidor del hotel...');
    
    try {
      const response = await axios.get(`${this.baseURL}/health`);
      if (response.data.status === 'OK') {
        console.log('   ✅ Servidor funcionando');
        console.log(`   📊 Versión: ${response.data.version}`);
        console.log(`   🏨 Entorno: ${response.data.environment}`);
      }
    } catch (error) {
      throw new Error(`Servidor no responde: ${error.message}`);
    }
  }

  async loginAdmin() {
    console.log('\n2. 🔐 Iniciando sesión como administrador...');
    
    try {
      const response = await axios.post(`${this.baseURL}/api/auth/login`, {
        credential: 'admin@hotelmarazul.com', // Puede usar email o username
        password: 'Admin123!'
      });

      if (response.data.success && response.data.data.token) {
        this.token = response.data.data.token;
        console.log('   ✅ Login exitoso');
        console.log(`   👤 Usuario: ${response.data.data.user.first_name} ${response.data.data.user.last_name}`);
        console.log(`   🏷️ Rol: ${response.data.data.user.role}`);
        console.log(`   📧 Email: ${response.data.data.user.email}`);
      } else {
        throw new Error('Login falló - Respuesta inválida');
      }
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Login falló - Verifica credenciales de admin (admin@hotelmarazul.com / Admin123!)');
      }
      throw new Error(`Error en login: ${error.message}`);
    }
  }

  async createAllUsers() {
    console.log('\n3. 👥 Creando usuarios del hotel...');
    
    for (let i = 0; i < this.hotelUsers.length; i++) {
      const user = this.hotelUsers[i];
      console.log(`\n   📝 Procesando usuario ${i + 1}/${this.hotelUsers.length}: ${user.first_name} ${user.last_name} (${user.role})`);
      
      try {
        // Si es el admin por defecto, solo verificar que existe
        if (user.isDefault) {
          console.log('   ℹ️ Usuario administrador por defecto - verificando existencia...');
          const existingUser = await this.checkUserExists(user.email);
          if (existingUser) {
            console.log('   ✅ Admin por defecto encontrado');
            this.createdUsers.push({
              ...user,
              id: existingUser.id,
              alreadyExists: true
            });
          } else {
            console.log('   ⚠️ Admin por defecto no encontrado - creando...');
            await this.createUser(user);
          }
          continue;
        }

        // Verificar si el usuario ya existe
        const existingUser = await this.checkUserExists(user.email);
        if (existingUser) {
          console.log(`   ⚠️ Usuario ya existe: ${user.email}`);
          this.createdUsers.push({
            ...user,
            id: existingUser.id,
            alreadyExists: true
          });
          continue;
        }

        // Crear nuevo usuario
        await this.createUser(user);

      } catch (error) {
        console.log(`   ❌ Error procesando ${user.first_name}: ${error.message}`);
        
        if (error.response?.status === 409) {
          console.log('   💡 El usuario probablemente ya existe');
        } else if (error.response?.status === 403) {
          console.log('   💡 Permisos insuficientes para crear este tipo de usuario');
        } else if (error.response?.data) {
          console.log(`   📋 Detalles: ${JSON.stringify(error.response.data, null, 2)}`);
        }
        
        // Continuar con el siguiente usuario
        continue;
      }
    }
  }

  async createUser(user) {
    const response = await axios.post(
      `${this.baseURL}/api/auth/register`,
      {
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        username: user.username,
        password: user.password,
        phone: user.phone,
        role: user.role,
        language: user.language
      },
      {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.success) {
      const userData = response.data.data.user;
      console.log('   🎉 ¡Usuario creado exitosamente!');
      console.log(`   📧 Email: ${userData.email}`);
      console.log(`   👤 Username: ${userData.username}`);
      console.log(`   🏷️ Rol: ${userData.role}`);
      console.log(`   🆔 ID: ${userData.id}`);
      
      this.createdUsers.push({
        ...user,
        id: userData.id,
        alreadyExists: false
      });
    }
  }

  async checkUserExists(email) {
    try {
      // Intentar hacer login para verificar si existe
      const response = await axios.post(`${this.baseURL}/api/auth/login`, {
        credential: email,
        password: 'test' // Password falso solo para verificar si el usuario existe
      });
      return null; // Si llegamos aquí, hay un problema
    } catch (error) {
      if (error.response?.status === 401) {
        // Error 401 significa que el usuario existe pero password incorrecto
        // Necesitamos obtener los datos del usuario de otra forma
        return { email }; // Retornamos algo básico para indicar que existe
      }
      // Otros errores probablemente significa que no existe
      return null;
    }
  }

  async verifyUsers() {
    console.log('\n4. 🔍 Verificando usuarios creados por roles...');
    
    const roleMap = {
      admin: 'Administradores',
      manager: 'Gerentes',
      receptionist: 'Recepcionistas',
      cleaning: 'Personal de Limpieza',
      guest: 'Huéspedes'
    };

    const usersByRole = {};
    
    // Agrupar usuarios por rol
    this.createdUsers.forEach(user => {
      if (!usersByRole[user.role]) {
        usersByRole[user.role] = [];
      }
      usersByRole[user.role].push(user);
    });

    // Mostrar estadísticas por rol
    Object.keys(roleMap).forEach(role => {
      const users = usersByRole[role] || [];
      console.log(`\n   📊 ${roleMap[role]}: ${users.length} usuario(s)`);
      
      users.forEach(user => {
        const status = user.alreadyExists ? '(Ya existía)' : '(Creado)';
        console.log(`   ✅ ${user.first_name} ${user.last_name} - ${user.email} ${status}`);
      });
    });

    console.log(`\n   🎯 Total de usuarios procesados: ${this.createdUsers.length}`);
  }

  async testUserLogins() {
    console.log('\n5. 🔐 Probando login de usuarios creados...');
    
    for (const user of this.hotelUsers) {
      console.log(`\n   🧪 Probando login: ${user.first_name} ${user.last_name} (${user.role})`);
      
      try {
        const response = await axios.post(`${this.baseURL}/api/auth/login`, {
          credential: user.email,
          password: user.password
        });

        if (response.data.success && response.data.data.token) {
          console.log('   ✅ Login exitoso');
          console.log(`   👤 Usuario: ${response.data.data.user.first_name} ${response.data.data.user.last_name}`);
          console.log(`   🏷️ Rol: ${response.data.data.user.role}`);
          console.log(`   🌐 Idioma: ${response.data.data.user.language}`);
          console.log(`   ✔️ Verificado: ${response.data.data.user.is_verified}`);
        }
      } catch (error) {
        console.log(`   ❌ Error en login: ${error.message}`);
        if (error.response?.status === 401) {
          console.log('   💡 Credenciales incorrectas o cuenta bloqueada');
        }
      }
    }
  }

  showSummary() {
    console.log('\n📋 RESUMEN DE USUARIOS DEL HOTEL MAR AZUL');
    console.log('=' .repeat(80));
    
    const roleIcons = {
      admin: '👑',
      manager: '👔',
      receptionist: '📋',
      cleaning: '🧹',
      guest: '🏖️'
    };

    this.createdUsers.forEach((user, index) => {
      const icon = roleIcons[user.role] || '👤';
      console.log(`\n${index + 1}. ${icon} ${user.first_name} ${user.last_name} - ${user.role.toUpperCase()}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   👤 Username: ${user.username}`);
      console.log(`   🔑 Password: ${user.password}`);
      console.log(`   📞 Teléfono: ${user.phone}`);
      console.log(`   🌐 Idioma: ${user.language}`);
      console.log(`   📊 Estado: ${user.alreadyExists ? 'Ya existía' : 'Creado nuevo'}`);
      console.log(`   🆔 ID: ${user.id || 'N/A'}`);
    });

    console.log('\n💡 INFORMACIÓN DE ROLES:');
    console.log('   👑 ADMIN: Acceso completo al sistema');
    console.log('   👔 MANAGER: Gestión y reportes del hotel');
    console.log('   📋 RECEPTIONIST: Check-in/out, reservas, huéspedes');
    console.log('   🧹 CLEANING: Gestión de limpieza e incidencias');
    console.log('   🏖️ GUEST: Acceso limitado a sus propias reservas');

    console.log('\n🔐 CREDENCIALES PARA TESTING:');
    console.log('\n   📋 STAFF DEL HOTEL:');
    this.createdUsers.filter(u => ['admin', 'manager', 'receptionist', 'cleaning'].includes(u.role))
      .forEach((user, index) => {
        const icon = roleIcons[user.role];
        console.log(`\n   ${icon} ${user.role.toUpperCase()} - ${user.first_name} ${user.last_name}:`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Password: ${user.password}`);
      });

    console.log('\n   🏖️ HUÉSPEDES:');
    this.createdUsers.filter(u => u.role === 'guest')
      .forEach((user, index) => {
        console.log(`\n   Huésped ${index + 1} - ${user.first_name} ${user.last_name}:`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Password: ${user.password}`);
      });
  }

  // Método para mostrar configuración actual
  showConfig() {
    console.log('\n🏨 CONFIGURACIÓN DEL HOTEL MAR AZUL:');
    console.log(`   🌐 URL Base: ${this.baseURL}`);
    console.log(`   👥 Total usuarios a crear: ${this.hotelUsers.length}`);
    
    console.log('\n📋 DISTRIBUCIÓN POR ROLES:');
    const roleCount = {};
    this.hotelUsers.forEach(user => {
      roleCount[user.role] = (roleCount[user.role] || 0) + 1;
    });
    
    Object.keys(roleCount).forEach(role => {
      const icon = {admin: '👑', manager: '👔', receptionist: '📋', cleaning: '🧹', guest: '🏖️'}[role] || '👤';
      console.log(`   ${icon} ${role.toUpperCase()}: ${roleCount[role]} usuario(s)`);
    });

    console.log('\n📝 LISTA COMPLETA:');
    this.hotelUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.first_name} ${user.last_name} (${user.role})`);
      console.log(`      📧 ${user.email}`);
    });
  }
}

// Función para mostrar ayuda
function showHelp() {
  console.log('\n🏨 Hotel Mar Azul - Creador de Usuarios del Sistema\n');
  console.log('Uso:');
  console.log('   node create-hotel-users.js           # Crear todos los usuarios');
  console.log('   node create-hotel-users.js --help    # Mostrar ayuda');
  console.log('   node create-hotel-users.js --config  # Mostrar configuración\n');
  
  console.log('👥 Tipos de usuarios que se crearán:');
  console.log('   👑 1 Administrador (admin por defecto)');
  console.log('   👔 1 Gerente');
  console.log('   📋 2 Recepcionistas');
  console.log('   🧹 2 Personal de limpieza');
  console.log('   🏖️ 2 Huéspedes de prueba\n');
  
  console.log('🔧 Funcionalidades por rol:');
  console.log('   👑 ADMIN: Control total del sistema');
  console.log('   👔 MANAGER: Reportes, gestión avanzada');
  console.log('   📋 RECEPTIONIST: Reservas, check-in/out');
  console.log('   🧹 CLEANING: Limpieza, incidencias');
  console.log('   🏖️ GUEST: Ver sus reservas únicamente');
  
  console.log('\n📋 Credenciales del admin por defecto:');
  console.log('   📧 Email: admin@hotelmarazul.com');
  console.log('   🔑 Password: Admin123!');
}

// Ejecutar script
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }
  
  const creator = new HotelUsersCreator();
  
  if (args.includes('--config') || args.includes('-c')) {
    creator.showConfig();
    return;
  }
  
  try {
    await creator.runCreation();
    
  } catch (error) {
    console.error('\n💡 SOLUCIONES POSIBLES:');
    
    if (error.message.includes('Servidor no responde')) {
      console.error('   1. Verifica que tu servidor esté ejecutándose: npm start');
      console.error('   2. Verifica que la URL sea correcta: http://localhost:3000');
      console.error('   3. Verifica el endpoint /health en tu servidor');
    } else if (error.message.includes('Login falló')) {
      console.error('   1. Verifica que el usuario admin existe');
      console.error('   2. Ejecuta el método createDefaultAdmin() en tu modelo User');
      console.error('   3. Verifica las credenciales: admin@hotelmarazul.com / Admin123!');
    } else if (error.message.includes('Error procesando')) {
      console.error('   1. Algunos usuarios pueden ya existir en la base de datos');
      console.error('   2. Verifica los permisos de creación de usuarios');
      console.error('   3. Revisa las validaciones en el middleware');
    }
    
    console.error('\n🔧 Debug adicional:');
    console.error('   - Revisa los logs del servidor');
    console.error('   - Verifica la conexión a la base de datos');
    console.error('   - Confirma que todas las validaciones estén correctas');
    
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main();
}

module.exports = { HotelUsersCreator };