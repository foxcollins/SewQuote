# Product

## 1. Nombre provisional
**SewQuote** (nombre de la app aprobado).

## 2. Descripción
**SewQuote**: PWA SaaS multi-tenant para costureras, modistas y pequeños talleres que calcula presupuestos de confección, ajuste y reparación de prendas a partir de costos reales (materiales con historial de precios, mano de obra, complejidad, urgencia y margen), convierte presupuestos aprobados en trabajos y conserva el histórico para futuras recomendaciones.

## 3. Visión
Ser la herramienta con la que la profesional calcula cuánto cobrar por cada trabajo de forma consistente y rentable, aprendiendo de su propio historial, sin convertirse en un ERP complejo.

## 4. Problema que resuelve
- Los precios de materiales cambian y no queda registro de qué precio se usó en cada presupuesto.
- Los cálculos manuales o la tabla de precios fija producen resultados inconsistentes o poco rentables.
- La información de clientes, medidas y trabajos anteriores se pierde o no se reutiliza.
- Enviar y hacer aprobar presupuestos por WhatsApp es manual y sin registro confiable.

## 5. Usuario objetivo
- Costureras y modistas independientes.
- Sastres.
- Pequeños ateliers y talleres de confección/reparación.

Usuario secundario (futuro): talleres con varios empleados, administradores de atelier, pequeñas empresas de confección.

## 6. Propuesta de valor
Calcular cuánto cobrar por cada trabajo basándose en costos reales, tiempo de trabajo y experiencia anterior, con un desglose verificable y decisión final siempre en manos de la profesional.

## 7. Principales casos de uso
1. Registrar y mantener el catálogo de servicios y materiales con historial de precios.
2. Crear un presupuesto con uno o varios trabajos/piezas y calcular el precio sugerido.
3. Ajustar manualmente el precio final conservando el sugerido y el motivo.
4. Compartir el presupuesto y registrar su aprobación.
5. Convertir un presupuesto aprobado en trabajo/orden de producción y seguirlo hasta la entrega.
6. Registrar el resultado real (tiempo, materiales, precio, observaciones) para alimentar el histórico.
7. Consultar clientes, personas destinatarias, medidas y trabajos anteriores.

## 8. Flujo principal del producto
```text
Catálogo (servicios, materiales, precios, configuración)
→ Cliente (+ persona destinataria si difiere)
→ Presupuesto con N trabajos/piezas
→ Motor calcula precio sugerido con desglose
→ Profesional ajusta precio final si corresponde
→ Presupuesto enviado al cliente (borrador/en vencimiento controlado)
→ Aprobación (registrada)
→ Conversión a trabajo/producción
→ Listo → Entregado
→ Resultado real queda en el histórico
```

## 9. Funcionalidades del MVP
- Auth y alta de negocio/tenant.
- Configuración del tenant: moneda, idioma, zona horaria, tarifa horaria, margen por defecto, desperdicio, factores de complejidad y recargos de urgencia.
- Clientes: crear, editar, consultar, archivar.
- Catálogo de servicios: nombre, categoría, precio base opcional, tiempo estimado, unidad, estado.
- Materiales: crear con nombre, categoría y unidad; precio actual e historial de precios (nunca sobrescribir).
- Presupuestos: múltiples trabajos/piezas por presupuesto, cada trabajo con categoría, servicios, materiales, cantidades, complejidad, urgencia, notas y fecha de caducidad.
- Motor de cálculo determinístico con desglose; override de precio final con motivo opcional; snapshot de precios al guardar.
- Estados de presupuesto y de trabajo; conversión de presupuesto aprobado a trabajo.
- Registro básico de resultado real del trabajo.
- Medidas: historial por persona + snapshot en el trabajo (REQ-025).
- Enlace público de solo lectura con aprobación registrada, sin cuenta del cliente (REQ-026).
- PWA responsive e instalable.

## 10. Funcionalidades fuera del MVP
Marcadas como futuras (no promover al MVP):
- Pagos, Pix, comprobantes.
- Inventario/stock.
- Gastos del negocio y rentabilidad (dashboard financiero).
- Agenda, WhatsApp oficial, fotografías (gestión de fotos de prendas).
- IA (interpreta; no calcula precios).
- Contabilidad, facturación electrónica, nómina, marketplace, e-commerce, app nativa.

Nota: medidas y enlace público de aprobación **pasan a esta versión** (decisión del usuario); ver sección 9.

## 11. Principios del producto
1. El motor determinístico calcula; la IA interpreta y asiste; la profesional decide.
2. Presupuesto simple de crear: mínimos pasos, campos avanzados opcionales.
3. Multi-tenant desde el inicio: todo dato pertenece a un tenant.
4. Reproducibilidad histórica: snapshots de precios (y de medidas cuando apliquen).
5. No ERP: alcance acotado y extensible.
6. Internacionalización: no asumir BRL/Brasil/ español como únicos.

## 12. Conceptos principales del dominio
- **Tenant/negocio**: unidad de aislamiento; su catálogo y configuración.
- **Cliente**: quien contrata (nombre, teléfono, WhatsApp, email, dirección, notas).
- **Persona destinataria**: quien usa la prenda; puede ser distinta del cliente (María contrata arreglo del vestido de Ana).
- **Medida**: registro con fecha, con historial por persona; snapshot en el trabajo cuando se use.
- **Servicio**: unidad facturable del catálogo (reparación, ajuste, confección, personalizado…).
- **Material**: ítem del catálogo del tenant con unidad y precio con historial; el sistema no interpreta su naturaleza.
- **Presupuesto**: agrupa N trabajos/piezas de un cliente; tiene caducidad, estados y versiones.
- **Trabajo/pieza**: unidad dentro del presupuesto, con categoría propia, servicios, materiales y persona destinataria.
- **Precio congelado (snapshot)**: precio unitario aplicado al guardar el presupuesto; no cambia si cambia el catálogo.
- **Versión de presupuesto**: snapshot formal en envío, aprobación o recálculo por vencimiento; no en cada edición de borrador.
- **Orden/trabajo de producción**: derivado de un presupuesto aprobado; tiene su propio ciclo de estados hasta entrega.

## 13. Reglas de negocio importantes
1. Un cliente puede tener varios presupuestos simultáneos.
2. Un presupuesto contiene múltiples trabajos/piezas; cada trabajo tiene categoría propia (reparación, ajuste, confección…). No asumir una prenda o una categoría por presupuesto.
3. Materiales: catálogo por tenant; cantidad × precio unitario; historial de precios nunca sobrescrito; precio congelado en el presupuesto al guardarlo.
4. Todo presupuesto tiene fecha de caducidad. Vencido: se marca como vencido y se avisa que los precios pueden haber cambiado; no se recalcula solo. La actualización manual genera una nueva versión.
5. Mano de obra: precio fijo (ej. confección de vestido = 250) o por horas (horas × tarifa del tenant). Elegible por presupuesto/trabajo.
6. Margen configurable por tenant como valor por defecto; el presupuesto puede usar otro.
7. Flujo de estados conceptual: BORRADOR → ENVIADO → APROBADO → TRABAJO → EN PRODUCCIÓN → LISTO → ENTREGADO. Editable mientras sea borrador; una vez aprobado no se edita directamente: cambios → nueva versión.
8. Presupuesto aprobado se convierte en trabajo/proceso de producción. Sin pagos en el MVP.
9. Inventario fuera del MVP: solo catálogo de materiales para cálculo + historial de precios.
10. El cliente no asume que es la persona que usa la prenda: separar CLIENTE y PERSONA DESTINATARIA.
11. Medidas con historial por persona, reutilizables como referencia con advertencia si son antiguas; el trabajo guarda snapshot de las medidas usadas + referencia al registro de origen. **Incluida en esta versión.**
12. Presupuesto compartible por enlace público con botón de aprobación registrada, sin cuenta del cliente. **Incluida en esta versión.**
13. Versionado importante en modificaciones formales (envío, aprobación, recálculo por vencimiento), no por cada edición en borrador.
14. Gastos adicionales fuera del MVP.
15. Categorías de trabajos por presupuesto (ej. #100: Reparación—camisa, Ajuste—pantalón, Confección—blusa).
16. SaaS multi-tenant con aislamiento total (RLS) desde el diseño inicial.
17. IA asistiva: resumen diario, alertas, resumen operativo y consultas sobre datos reales; no decide precios, costos ni estados.

## 14. Experiencia del cliente al recibir un presupuesto
- Recibe un enlace o presentación clara: cliente/persona, trabajos con su categoría, materiales relevantes, desglose/total, fecha de caducidad y observaciones.
- Puede aprobar con un botón único (`APROVAR ORÇAMENTO` / equivalente i18n); la aprobación queda registrada.
- No necesita cuenta en el sistema para consultar ni aprobar.
- Si el presupuesto está vencido, se le indica que los precios pueden haber cambiado.

## 15. Papel de la IA
- V2 en el roadmap; opcional y no dependencia del MVP.
- Transforma lenguaje natural en datos estructurados que la profesional edita antes del cálculo (human-in-the-loop).
- Operar sobre datos reales del sistema: resúmenes, alertas de vencimientos/entregas, consultas.
- Restricciones: no inventar precios, no aprobar presupuestos, no cambiar tarifa/margen, no confirmar órdenes, no saltarse permisos.
- El motor determinístico calcula el precio; la IA jamás es la autoridad del cálculo.

## 16. Consideraciones multi-tenant
- Todo dato de negocio lleva `tenant_id` y está protegido por RLS.
- Catálogo, configuración, clientes, presupuestos, trabajos e historial son por tenant.
- Aislamiento completo entre Tenant A y Tenant B desde el diseño (no como parche posterior).

## 17. Evolución futura prevista
- **V1**: PDF, WhatsApp, fotos, agenda, pagos, dashboard financiero, rentabilidad, historial avanzado. (Medidas y enlace público: **ya incluidos en esta versión**.)
- **V2**: IA asistiva, recomendaciones por histórico, predicción de tiempo, detección de subprecio, análisis de imágenes.
- **Métricas antes de ampliar**: presupuestos/usuario, tiempo de creación, % aceptados, trabajos registrados, reutilización, brecha sugerido vs final, retención.
