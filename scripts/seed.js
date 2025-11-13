/**
 * Script de Semillas (Seeds) - Sistema de Gestión Hotelera "Mar Azul"
 * Desarrollador: Alexander Echeverria
 *
 * Este script inserta datos de prueba en la base de datos
 * Incluye usuarios con diferentes roles para testing
 */

require('dotenv').config();
const { sequelize, User } = require('../src/models');
const { USER_ROLES } = require('../src/utils/constants');

const testUsers = [
    {
        first_name: 'Administrador',
        last_name: 'Sistema',
        email: 'admin@hotelmarazul.com',
        username: 'admin',
        password: 'Admin123!',
        role: USER_ROLES.ADMIN,
        phone: '+593987654321',
        is_active: true,
        is_verified: true
    },
    {
        first_name: 'Marlon',
        last_name: 'Ismalej',
        email: 'marlon.ismalej@hotelmarazul.com',
        username: 'marlon',
        password: 'Manager123!',
        role: USER_ROLES.MANAGER,
        phone: '+593987654322',
        is_active: true,
        is_verified: true
    },
    {
        first_name: 'Carlos',
        last_name: 'Hernández',
        email: 'carlos.hernandez@hotelmarazul.com',
        username: 'carlos',
        password: 'Reception123!',
        role: USER_ROLES.RECEPTIONIST,
        phone: '+593987654323',
        is_active: true,
        is_verified: true
    },
    {
        first_name: 'Rosa',
        last_name: 'García',
        email: 'rosa.garcia@hotelmarazul.com',
        username: 'rosa',
        password: 'Cleaning123!',
        role: USER_ROLES.CLEANING,
        phone: '+593987654324',
        is_active: true,
        is_verified: true
    },
    {
        first_name: 'Isabella',
        last_name: 'Johnson',
        email: 'isabella.johnson@gmail.com',
        username: 'isabella',
        password: 'Guest123!',
        role: USER_ROLES.GUEST,
        phone: '+593987654325',
        is_active: true,
        is_verified: true
    }
];

async function seedDatabase() {
    try {
        console.log('🌱 Iniciando seed de la base de datos...');

        // Conectar a la base de datos
        await sequelize.authenticate();
        console.log('✅ Conexión a la base de datos establecida');

        // Verificar si ya existen usuarios
        const userCount = await User.count();
        console.log(`📊 La base de datos contiene ${userCount} usuario(s) actualmente`);

        // Insertar usuarios de prueba solo si no existen
        console.log(`\n📝 Verificando e insertando ${testUsers.length} usuarios de prueba...`);

        let created = 0;
        let skipped = 0;

        for (const userData of testUsers) {
            try {
                // Verificar si el usuario ya existe por email o username
                const existingUser = await User.findOne({
                    where: {
                        [sequelize.Sequelize.Op.or]: [
                            { email: userData.email.toLowerCase() },
                            { username: userData.username.toLowerCase() }
                        ]
                    }
                });

                if (existingUser) {
                    console.log(`⏭️  Usuario ya existe: ${userData.username} (${userData.role})`);
                    skipped++;
                } else {
                    const user = await User.create(userData);
                    console.log(`✅ Usuario creado: ${user.username} (${user.role})`);
                    created++;
                }
            } catch (error) {
                console.error(`❌ Error al crear usuario ${userData.username}:`, error.message);
            }
        }

        console.log(`\n📈 Resumen: ${created} creados, ${skipped} omitidos (ya existían)`);


        // Mostrar resumen
        console.log('\n📊 Resumen de usuarios creados:');
        console.log('================================');

        for (const role of Object.values(USER_ROLES)) {
            const count = await User.count({ where: { role } });
            console.log(`${role.toUpperCase().padEnd(15)} : ${count} usuario(s)`);
        }

        console.log('\n🎉 Seed completado exitosamente!');
        console.log('\n📋 Credenciales de prueba:');
        console.log('================================');
        console.log('ADMIN:');
        console.log('  Email: admin@hotelmarazul.com');
        console.log('  Usuario: admin');
        console.log('  Password: Admin123!');
        console.log('\nMANAGER:');
        console.log('  Email: marlon.ismalej@hotelmarazul.com');
        console.log('  Usuario: marlon');
        console.log('  Password: Manager123!');
        console.log('\nRECEPCIONISTA:');
        console.log('  Email: carlos.hernandez@hotelmarazul.com');
        console.log('  Usuario: carlos');
        console.log('  Password: Reception123!');
        console.log('\nLIMPIEZA:');
        console.log('  Email: rosa.garcia@hotelmarazul.com');
        console.log('  Usuario: rosa');
        console.log('  Password: Cleaning123!');
        console.log('\nHUÉSPED:');
        console.log('  Email: isabella.johnson@gmail.com');
        console.log('  Usuario: isabella');
        console.log('  Password: Guest123!');
        console.log('================================\n');

    } catch (error) {
        console.error('❌ Error durante el seed:', error);
        throw error;
    } finally {
        await sequelize.close();
        console.log('🔌 Conexión cerrada');
    }
}

// Ejecutar el seed
seedDatabase()
    .then(() => {
        console.log('✨ Proceso completado');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Error fatal:', error);
        process.exit(1);
    });
