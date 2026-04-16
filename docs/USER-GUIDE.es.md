# Guía del Usuario

Una guía completa para usar Spec Workflow MCP para desarrollo de software asistido por IA.

## Comenzando

### ¿Qué es Spec Workflow MCP?

Spec Workflow MCP es un servidor Model Context Protocol que proporciona herramientas de desarrollo estructurado basado en especificaciones para asistentes de IA. Te ayuda a:

- Crear especificaciones detalladas antes de codificar
- Rastrear el progreso de implementación
- Gestionar aprobaciones y revisiones
- Mantener documentación del proyecto

### Flujo de Trabajo Básico

1. **Crear una especificación** - Define lo que quieres construir
2. **Revisar y aprobar** - Asegurar que las especificaciones cumplan requisitos
3. **Implementar tareas** - Ejecutar el plan de implementación
4. **Rastrear progreso** - Monitorear estado de completitud

## Crear Especificaciones

### Creación Simple de Especificación

Pide a tu asistente de IA que cree una especificación:

```
"Crea una especificación para autenticación de usuarios"
```

La IA automáticamente:

1. Creará un documento de requisitos
2. Diseñará el enfoque técnico
3. Desglosará la implementación en tareas

### Creación Detallada de Especificación

Proporciona más contexto para mejores especificaciones:

```
"Crea una especificación llamada pasarela-de-pago con las siguientes características:
- Procesamiento de tarjetas de crédito
- Integración con PayPal
- Gestión de suscripciones
- Manejo de webhooks para eventos de pago"
```

### Desde Documentos Existentes

Usa tu PRD o documentos de diseño existentes:

```
"Construye una especificación desde @requisitos-producto.md"
```

## Gestionar Especificaciones

### Listar Todas las Especificaciones

```
"Lista todas mis especificaciones"
```

Retorna:

- Nombres de especificaciones
- Estado actual
- Porcentaje de progreso
- Estados de documentos

### Verificar Estado de Especificación

```
"Muéstrame el estado de la especificación user-auth"
```

Proporciona:

- Estado de aprobación de requisitos
- Estado de aprobación de diseño
- Progreso de completitud de tareas
- Desglose detallado de tareas

### Ver Documentos de Especificación

Usa el panel de control o extensión VSCode para:

- Leer documentos de requisitos
- Revisar documentos de diseño
- Explorar listas de tareas
- Rastrear progreso de implementación

## Trabajar con Tareas

### Estructura de Tareas

Las tareas están organizadas jerárquicamente:

- **1.0** - Secciones principales
  - **1.1** - Subtareas
  - **1.2** - Subtareas
    - **1.2.1** - Pasos detallados

### Implementar Tareas

#### Método 1: Implementación Directa

```
"Implementa la tarea 1.2 de la especificación user-auth"
```

#### Método 2: Copiar desde el Panel

1. Abrir el panel de control
2. Navegar a tu especificación
3. Hacer clic en pestaña "Tareas"
4. Hacer clic en botón "Copiar Prompt" junto a cualquier tarea
5. Pegar en tu conversación de IA

#### Método 3: Implementación en Lote

```
"Implementa todas las tareas de configuración de base de datos de la especificación user-auth"
```

### Estado de Tareas

Las tareas tienen tres estados:

- ⏳ **Pendiente** - No iniciada
- 🔄 **En Progreso** - Actualmente en trabajo
- ✅ **Completada** - Terminada

## Flujo de Trabajo de Aprobación

### Solicitar Aprobación

Cuando los documentos estén listos para revisión:

1. La IA solicita aprobación automáticamente
2. El panel muestra notificación
3. Revisar el documento
4. Proporcionar retroalimentación o aprobar

### Acciones de Aprobación

- **Aprobar** - Aceptar el documento tal como está
- **Solicitar Cambios** - Proporcionar retroalimentación para revisión
- **Rechazar** - Comenzar de nuevo con nuevos requisitos

### Proceso de Revisión

1. Proporcionar retroalimentación específica
2. La IA revisa el documento
3. Revisar versión actualizada
4. Aprobar o solicitar más cambios

## Flujo de Trabajo de Bugs

### Reportar Bugs

```
"Crea un reporte de bug para falla de login al usar SSO"
```

Crea:

- Descripción del bug
- Pasos para reproducir
- Comportamiento esperado vs actual
- Prioridad y severidad

### Resolución de Bugs

```
"Crea una corrección para el bug #123 en la especificación user-auth"
```

Genera:

- Análisis de causa raíz
- Plan de implementación de corrección
- Requisitos de prueba
- Pasos de despliegue

## Sistema de Plantillas

### Usar Plantillas

Spec Workflow incluye plantillas para:

- Documentos de requisitos
- Documentos de diseño
- Listas de tareas
- Reportes de bugs
- Documentos de orientación

### Plantillas Personalizadas

Crea tus propias plantillas en `.specflow/templates/`:

```markdown
# Plantilla de Característica Personalizada

## Descripción General

[Descripción de la característica]

## Historias de Usuario

[Historias de usuario]

## Requisitos Técnicos

[Detalles técnicos]
```

## Características Avanzadas

### Documentos de Orientación

Crea guía de proyecto de alto nivel:

```
"Crea documentos de orientación para mi proyecto de e-commerce"
```

Genera:

- **Orientación de producto** - Visión y objetivos
- **Orientación técnica** - Decisiones de arquitectura
- **Orientación de estructura** - Organización del proyecto

### Sistema de Archivo

Gestiona especificaciones completadas:

- Mover especificaciones terminadas a archivo
- Mantener espacio de trabajo activo limpio
- Acceder a especificaciones archivadas en cualquier momento
- Restaurar especificaciones cuando sea necesario

### Soporte Multiidioma

Cambiar idioma de interfaz:

1. **Panel de Control**: Configuración → Idioma
2. **Extensión VSCode**: Configuración de Extensión → Idioma
3. **Archivo de configuración**: `lang = "es"` (u otro código de idioma)

## Mejores Prácticas

### 1. Comenzar con Documentos de Orientación

Antes de crear especificaciones:

```
"Crea documentos de orientación para guiar el proyecto"
```

### 2. Ser Específico en Requisitos

Bueno:

```
"Crea una especificación para autenticación de usuarios con:
- Login email/contraseña
- OAuth2 (Google, GitHub)
- Soporte 2FA
- Flujo de restablecimiento de contraseña"
```

No ideal:

```
"Crea una especificación de login"
```

### 3. Revisar Antes de Implementar

Siempre revisar y aprobar:

1. Documento de requisitos
2. Documento de diseño
3. Desglose de tareas

### 4. Implementar Incrementalmente

- Completar tareas en orden
- Probar después de cada sección importante
- Actualizar estado de tareas regularmente

### 5. Usar el Panel de Control

El panel proporciona:

- Seguimiento visual de progreso
- Navegación fácil de documentos
- Acciones rápidas de aprobación
- Actualizaciones en tiempo real

## Flujos de Trabajo Comunes

### Desarrollo de Características

1. Crear especificación: `"Crea especificación para característica de carrito-de-compras"`
2. Revisar requisitos en panel
3. Aprobar o solicitar cambios
4. Revisar documento de diseño
5. Aprobar diseño
6. Implementar tareas secuencialmente
7. Rastrear progreso en panel

### Corrección de Bugs

1. Reportar bug: `"Crea reporte de bug para error de checkout"`
2. Analizar: `"Analiza causa raíz del bug #45"`
3. Planear corrección: `"Crea plan de corrección para bug #45"`
4. Implementar: `"Implementa la corrección"`
5. Verificar: `"Crea plan de prueba para corrección del bug #45"`

### Refactorización

1. Crear especificación: `"Crea especificación para optimización de base de datos"`
2. Documentar estado actual
3. Diseñar mejoras
4. Planear pasos de migración
5. Implementar incrementalmente
6. Verificar cada paso

## Consejos y Trucos

### Gestión Eficiente de Tareas

- Usar agrupación de tareas para elementos relacionados
- Copiar prompts desde panel para precisión
- Marcar tareas completas inmediatamente después de terminar

### Gestión de Documentos

- Mantener requisitos concisos pero completos
- Incluir criterios de aceptación
- Agregar restricciones técnicas en diseño
- Referenciar documentos externos cuando sea necesario

### Colaboración

- Usar comentarios de aprobación para retroalimentación
- Compartir URL del panel con equipo
- Exportar documentos para revisión externa
- Rastrear cambios a través del historial de revisión

## Integración con Asistentes de IA

### Conciencia Contextual

El asistente de IA automáticamente:

- Conoce tu estructura de proyecto
- Entiende relaciones de especificaciones
- Rastrea progreso de implementación
- Mantiene consistencia

### Comandos en Lenguaje Natural

Habla naturalmente:

- "¿Qué especificaciones tengo?"
- "Muéstrame lo que falta hacer"
- "Comienza a trabajar en la siguiente tarea"
- "Actualiza el diseño para mejor rendimiento"

### Flujo de Trabajo Continuo

La IA mantiene contexto entre sesiones:

- Reanudar donde dejaste
- Referenciar decisiones previas
- Construir sobre trabajo existente
- Mantener coherencia del proyecto

## Documentación Relacionada

- [Proceso de Flujo de Trabajo](WORKFLOW.es.md) - Guía detallada de flujo de trabajo
- [Guía de Prompts](PROMPTING-GUIDE.es.md) - Ejemplos de prompts
- [Guía de Interfaces](INTERFACES.es.md) - Detalles del panel y extensión
- [Referencia de Herramientas](TOOLS-REFERENCE.es.md) - Documentación completa de herramientas
