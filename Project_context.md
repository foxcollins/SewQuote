\# CONTEXTO DEL PROYECTO



Estamos diseñando un SaaS multi-tenant para costureras y pequeños negocios de confección/reparación de prendas.



El objetivo es facilitar la gestión de:



\* Clientes

\* Personas para quienes se realizan las prendas

\* Presupuestos

\* Materiales y sus precios históricos

\* Trabajos

\* Medidas

\* Notas

\* Imágenes

\* Seguimiento del trabajo

\* Aprobación de presupuestos mediante un enlace público

\* Asistente IA operativo



La prioridad es construir un MVP simple, útil y extensible. No debemos convertirlo inicialmente en un ERP ni incorporar funcionalidades que no sean necesarias.



La arquitectura prevista será basada en Supabase + frontend web/PWA, con soporte multi-tenant desde el inicio.



\---



\# DECISIONES DE NEGOCIO YA TOMADAS



Estas decisiones fueron discutidas y deben considerarse como reglas ya definidas. No las vuelvas a cuestionar salvo que detectes una contradicción importante.



\## 1. Presupuestos



Una cliente puede tener varios presupuestos simultáneamente.



Un presupuesto NO representa necesariamente una única prenda.



Un presupuesto puede contener múltiples trabajos/piezas.



Ejemplo:



Presupuesto #001



\* Reparar camisa

\* Reparar pantalón

\* Confeccionar blusa

\* Confeccionar vestido



Cada trabajo/pieza puede tener su propia descripción, categoría, costos, materiales y persona destinataria.



\---



\## 2. Materiales



Cada tenant tendrá su propio catálogo de materiales.



Ejemplos:



\* Oxford azul

\* Lino

\* Algodón

\* Cremallera

\* Botones

\* Encaje

\* Etc.



Los materiales tienen precio y unidad.



El precio puede cambiar a lo largo del tiempo.



Debe existir historial de precios.



Ejemplo:



Oxford azul:



\* 10/09/2026 → R$ 25/m

\* 20/10/2026 → R$ 27/m

\* 15/12/2026 → R$ 31/m



El cálculo de materiales será:



cantidad × precio unitario.



IMPORTANTE:



Cuando un material se utiliza en un presupuesto, el precio aplicado debe quedar congelado en ese presupuesto.



Si posteriormente cambia el precio del material, los presupuestos anteriores NO deben cambiar automáticamente.



\---



\## 3. Fecha de caducidad del presupuesto



Todo presupuesto debe tener una fecha de caducidad.



Ejemplo:



Creado: 23/09/2026

Válido hasta: 30/09/2026



Después de la fecha de caducidad, el sistema debe indicar que el presupuesto está vencido y que los precios pueden haber cambiado.



NO recalcular automáticamente.



Debe existir posteriormente una opción para actualizar/recalcular el presupuesto utilizando precios actuales.



La actualización debe generar una nueva versión del presupuesto.



\---



\## 4. Mano de obra



Se soportarán dos formas:



\### Precio fijo



Ejemplo:



Confección del vestido = R$ 250



\### Por horas



Ejemplo:



8 horas × R$ 30/h = R$ 240



El tenant podrá configurar su valor por hora.



En cada presupuesto/trabajo se podrá elegir el método correspondiente.



\---



\## 5. Margen de ganancia



El margen debe ser configurable por tenant.



Ejemplo:



Tenant:



Margen predeterminado = 40%



Pero un presupuesto concreto puede utilizar otro margen.



La configuración del tenant funciona como valor predeterminado, no como regla obligatoria.



\---



\## 6. Estados del presupuesto y trabajo



Flujo conceptual:



BORRADOR

↓

ENVIADO

↓

APROBADO

↓

TRABAJO

↓

EN PRODUCCIÓN

↓

LISTO

↓

ENTREGADO



Mientras el presupuesto sea editable puede modificarse.



Una vez aprobado, no debe modificarse directamente.



Si es necesario realizar cambios después de una aprobación, se debe crear una nueva versión.



\---



\## 7. Presupuesto aprobado



Cuando el cliente aprueba un presupuesto, este pasa a convertirse en un trabajo/proceso de producción.



Por ahora NO se gestionarán pagos.



Los pagos podrán incorporarse en una fase futura.



\---



\## 8. Pagos



NO forman parte del MVP.



En el futuro podría existir:



\* Pix

\* Comprobante de pago

\* Número de transacción

\* Botón "Ya realicé el pago"

\* Subida de comprobante

\* Validación/aprobación del pago por parte del tenant



Pero no implementar esto ahora.



\---



\## 9. Inventario



NO habrá inventario en el MVP.



El sistema solamente administrará los materiales utilizados para calcular presupuestos y sus precios históricos.



No se controlará:



\* cantidad disponible

\* stock

\* entradas

\* salidas

\* almacén



\---



\## 10. Materiales



El sistema no necesita conocer la naturaleza de los materiales.



Un material es simplemente algo administrado por el tenant.



Ejemplo:



Material:

Oxford azul



Unidad:

metro



Precio:

R$ 25



El significado y uso del material queda bajo responsabilidad del tenant.



\---



\## 11. Clientes



Debe existir un buen manejo de clientes.



Datos previstos:



\* Nombre

\* Teléfono

\* WhatsApp

\* Email

\* Dirección

\* Notas



Un cliente puede tener:



\* múltiples presupuestos

\* múltiples trabajos

\* historial de medidas

\* imágenes

\* notas



\---



\# DECISIÓN IMPORTANTE SOBRE PERSONAS Y MEDIDAS



NO asumir que la persona que contrata el servicio es necesariamente la persona que utilizará la prenda.



Ejemplo:



Cliente:



María



María puede contratar:



"Reparar el vestido de mi hija Ana."



Por eso debemos separar:



CLIENTE

↓

PERSONA DESTINATARIA DE LA PRENDA



Ejemplo:



Cliente:

María



Persona:

Ana



\---



\## Historial de medidas



Las medidas deben tener historial.



Ejemplo:



Ana:



Medidas 2026-01:



\* Busto: 88

\* Cintura: 70

\* Cadera: 94



Medidas 2026-09:



\* Busto: 90

\* Cintura: 74

\* Cadera: 97



Las medidas pueden reutilizarse como referencia.



Al crear un nuevo trabajo, el sistema puede sugerir las medidas más recientes.



Si las medidas son antiguas, debe mostrar una advertencia.



Ejemplo:



"Estas medidas fueron registradas hace 8 meses. Se recomienda confirmar antes de utilizarlas."



\---



\## Regla definitiva de medidas



Las medidas NO deben quedar únicamente asociadas al cliente.



Debe existir un perfil/historial de medidas de la persona.



Además, cada trabajo debe guardar un SNAPSHOT de las medidas realmente utilizadas.



Conceptualmente:



Persona

↓

Historial de medidas

↓

Trabajo

↓

Snapshot de medidas utilizadas



Ejemplo:



Trabajo #123



Persona:

Ana



Medidas utilizadas:



Busto: 88 cm

Cintura: 70 cm

Cadera: 94 cm



Aunque posteriormente cambien las medidas de Ana, el trabajo histórico debe conservar las medidas que realmente se utilizaron.



Idealmente debe conservarse también la referencia al perfil/registro de medidas del cual fueron tomadas.



\---



\# 12. Imágenes



Se podrán utilizar imágenes para:



\* prendas

\* referencias

\* bocetos

\* resultado final

\* materiales

\* futuras comprobaciones de pago



Para el MVP se puede utilizar Cloudinary Free Tier.



\---



\# 13. Presupuesto público



El presupuesto debe poder compartirse mediante un enlace público.



Ejemplo:



https://app.com/orcamento/ABC123



El cliente abre el enlace desde WhatsApp y puede visualizar:



\* Cliente/persona

\* Trabajos

\* Materiales relevantes

\* Costos/precio final según corresponda

\* Total

\* Fecha de caducidad

\* Observaciones



Debe existir un botón:



"APROVAR ORÇAMENTO"



La aprobación debe quedar registrada.



El cliente no necesita tener una cuenta en el sistema para consultar/aprobar el presupuesto.



\---



\# 14. Versiones



El versionado es importante.



Ejemplo:



Presupuesto #102



v1 → R$ 450

v2 → R$ 480

v3 → R$ 510



No es necesario crear una nueva versión por cada pequeña edición mientras el presupuesto esté en borrador.



Las versiones son importantes cuando existe una modificación formal del presupuesto, especialmente después de haberlo enviado o cuando se recalcula después de su vencimiento.



\---



\# 15. Gastos adicionales



NO forman parte del MVP.



Podrán incorporarse en el futuro si los tenants los necesitan.



\---



\# 16. Categorías y trabajos



Debe existir un sistema de categorías para los trabajos.



Ejemplos:



\* Reparación

\* Ajuste

\* Confección

\* Personalizado

\* Etc.



Un presupuesto puede contener múltiples trabajos y cada trabajo puede pertenecer a una categoría diferente.



Ejemplo:



Presupuesto #100



1\. Reparación — camisa

2\. Ajuste — pantalón

3\. Confección — blusa



No asumir que un presupuesto representa una única categoría.



\---



\# 17. Modelo SaaS



Debe ser MULTI-TENANT desde el inicio.



Ejemplo:



Tenant A



\* Clientes

\* Materiales

\* Presupuestos

\* Trabajos



Tenant B



\* Clientes

\* Materiales

\* Presupuestos

\* Trabajos



Cada tenant debe estar completamente aislado.



El sistema debe diseñarse pensando en RLS/multi-tenancy desde el comienzo.



\---



\# 18. IA



NO queremos inicialmente una IA que tome decisiones financieras o calcule automáticamente presupuestos sin supervisión.



La IA inicialmente será un asistente operativo.



Casos de uso previstos:



\### Resumen diario



Ejemplo:



"Bom dia, Maria."



"Hoje você tem:



\* Entregar vestido de Ana — hoje

\* Ajustar camisa de João — amanhã

\* Iniciar pantalón de Carlos — viernes"



\### Alertas



Ejemplos:



\* Presupuesto de Ana vence mañana.

\* Trabajo de Carlos tiene entrega mañana y todavía está en producción.

\* Presupuesto esperando aprobación.

\* Trabajo atrasado.



\### Resumen operativo



Ejemplo:



"Resumo de hoje:



2 entregas

1 trabalho atrasado

3 orçamentos aguardando aprovação

1 orçamento vence hoje"



\### Consulta



Posteriormente:



"¿Qué trabajos tengo que entregar esta semana?"



La IA debe responder utilizando los datos reales del sistema.



La IA debe ser principalmente una capa de ayuda sobre información estructurada, no la autoridad que decide precios, costos o estados.



\---



\# OBJETIVO DEL AGENTE



Con toda la información anterior, continúa el proceso SDD del proyecto.



\## PRIMER PASO OBLIGATORIO



Crear o actualizar:



`product.md`



NO empieces todavía por:



\* `data-model.md`

\* `architecture.md`

\* código

\* SQL

\* migraciones

\* componentes frontend



Primero necesitamos consolidar correctamente la definición del producto.



\---



\# QUÉ DEBE CONTENER product.md



Como mínimo:



1\. Nombre provisional del producto

2\. Descripción

3\. Visión

4\. Problema que resuelve

5\. Usuario objetivo

6\. Propuesta de valor

7\. Principales casos de uso

8\. Flujo principal del producto

9\. Funcionalidades del MVP

10\. Funcionalidades fuera del MVP

11\. Principios del producto

12\. Conceptos principales del dominio

13\. Reglas de negocio importantes

14\. Experiencia del cliente al recibir un presupuesto

15\. Papel de la IA

16\. Consideraciones multi-tenant

17\. Evolución futura prevista



\---



\# REGLAS PARA EL AGENTE



\* No inventes decisiones de negocio que todavía no fueron tomadas.

\* Si detectas una decisión realmente necesaria que falta, márcala como `DECISIÓN PENDIENTE`.

\* No conviertas funcionalidades futuras en funcionalidades del MVP.

\* No agregues pagos, Pix, inventario ni funcionalidades complejas al MVP.

\* Mantén separadas las responsabilidades de cliente, persona destinataria, medidas, presupuesto y trabajo.

\* No mezcles precio actual de materiales con precio histórico utilizado en presupuestos.

\* Mantén el concepto de snapshot de medidas en los trabajos.

\* Mantén el versionado de presupuestos.

\* El producto debe ser multi-tenant desde el inicio.

\* La IA debe ser asistiva y operar sobre información del sistema.

\* No escribas código todavía.

\* No diseñes las tablas todavía.

\* No tomes decisiones técnicas que todavía no sean necesarias.



\---



\# DESPUÉS DE CREAR product.md



No continúes automáticamente con todo el SDD.



Muéstrame:



1\. El `product.md` completo.

2\. Las decisiones de negocio que quedaron consolidadas.

3\. Las `DECISIONES PENDIENTES` que todavía debemos definir antes de pasar a `requirements.md`.



Después de mi aprobación continuaremos con `requirements.md`.



