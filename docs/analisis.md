\# Sistema Inteligente de Presupuestos para Confección y Reparación de Ropa



\## 1. Descripción



Aplicación web/PWA orientada a costureras, modistas, talleres de confección y pequeños ateliers para calcular presupuestos de confección, reparación y modificación de prendas.



El sistema combina:



\* Catálogo de servicios.

\* Costos de materiales.

\* Historial de precios.

\* Tiempo de trabajo.

\* Nivel de complejidad.

\* Margen de ganancia.

\* Historial de trabajos realizados.

\* Gestión de clientes.

\* Presupuestos.

\* Órdenes de trabajo.

\* IA como asistente para interpretar solicitudes y facilitar la creación de presupuestos.



El objetivo principal es ayudar a la profesional a \*\*calcular precios de forma consistente y rentable\*\*, sin depender únicamente de cálculos manuales o de una tabla de precios fija.



\---



\# 2. Usuarios



\### Usuario principal



Costureras, modistas, sastres y pequeños ateliers.



\### Usuario secundario



En una futura versión:



\* Talleres con varios empleados.

\* Administradores de ateliers.

\* Empresas pequeñas de confección.



\---



\# 3. Módulos principales



\## 3.1 Dashboard



Panel principal con:



\* Presupuestos pendientes.

\* Presupuestos aceptados.

\* Trabajos en producción.

\* Trabajos próximos a entregar.

\* Ingresos.

\* Gastos.

\* Ganancia estimada.

\* Ganancia real.

\* Trabajos recientes.



Indicadores:



```text

Presupuestos este mes

R$ 4.250



Trabajos realizados

27



Ingresos

R$ 6.800



Ganancia estimada

R$ 2.950

```



\---



\# 4. Clientes



Gestión de clientes.



\### Información



\* Nombre.

\* Teléfono.

\* WhatsApp.

\* Email.

\* Dirección.

\* Observaciones.

\* Fecha de registro.



\### Historial



Cada cliente puede tener:



\* Presupuestos.

\* Trabajos.

\* Pagos.

\* Prendas.

\* Medidas.

\* Fotografías.

\* Observaciones.



Esto permite consultar trabajos anteriores.



\---



\# 5. Prendas



Registro de prendas asociadas al cliente.



Ejemplos:



\* Vestido.

\* Vestido de fiesta.

\* Vestido de novia.

\* Pantalón.

\* Camisa.

\* Blusa.

\* Falda.

\* Chaqueta.

\* Traje.

\* Uniforme.



También puede existir una categoría:



\*\*Otro\*\*



\---



\# 6. Servicios



Catálogo de servicios que realiza la profesional.



Ejemplos:



\### Reparaciones



\* Cambio de cierre.

\* Reparación de costura.

\* Cambio de botón.

\* Reparación de bolsillo.

\* Reparación de forro.



\### Ajustes



\* Ajustar cintura.

\* Reducir laterales.

\* Ajustar mangas.

\* Acortar prenda.

\* Alargar prenda.

\* Ajustar hombros.



\### Confección



\* Confección de vestido.

\* Confección de pantalón.

\* Confección de camisa.

\* Confección personalizada.



Cada servicio puede tener:



\* Nombre.

\* Descripción.

\* Precio base.

\* Tiempo estimado.

\* Nivel de dificultad.

\* Unidad.

\* Activo/inactivo.



\---



\# 7. Materiales



Catálogo de materiales.



Ejemplos:



\* Satén.

\* Algodón.

\* Lino.

\* Seda.

\* Encaje.

\* Forro.

\* Cremalleras.

\* Botones.

\* Hilo.

\* Elástico.



Cada material tendrá:



\* Nombre.

\* Categoría.

\* Unidad de medida.

\* Proveedor opcional.

\* Precio actual.



\---



\# 8. Historial de precios de materiales



El precio de los materiales puede cambiar constantemente.



Por eso el sistema NO debe almacenar únicamente un precio actual.



Ejemplo:



```text

Satén



10/01/2026 → R$28/m

15/03/2026 → R$32/m

20/06/2026 → R$36/m

22/09/2026 → R$41/m

```



Cada cambio genera un nuevo registro histórico.



\### Regla



Los nuevos presupuestos utilizan el precio vigente.



Los presupuestos antiguos conservan el precio utilizado cuando fueron creados.



\---



\# 9. Costos de materiales



El usuario podrá indicar cuánto material necesita.



Ejemplo:



```text

Satén



Cantidad: 3,2 metros

Precio: R$41/m



Costo:

R$131,20

```



También se podrá configurar un porcentaje de desperdicio.



Ejemplo:



```text

Material:

R$131,20



Desperdicio:

10%



Costo considerado:

R$144,32

```



\---



\# 10. Configuración del valor de la hora



La profesional podrá definir su valor de trabajo.



Ejemplo:



```text

Valor de hora:

R$35

```



El sistema podrá calcular:



```text

3h × R$35 = R$105

```



También podrá existir una tarifa diferente para trabajos especiales.



\---



\# 11. Complejidad



Cada trabajo puede tener un nivel:



\* Baja.

\* Media.

\* Alta.

\* Muy alta.



La complejidad puede modificar el precio.



Ejemplo:



```text

Precio base: R$100



Complejidad alta:

+20%



Precio:

R$120

```



Los porcentajes deben ser configurables.



\---



\# 12. Urgencia



El usuario podrá indicar:



\* Normal.

\* Urgente.



Opcionalmente:



```text

Normal → 0%

Urgente → +20%

Muy urgente → +40%

```



Los porcentajes serán configurables.



\---



\# 13. Motor de presupuestos



El núcleo del sistema.



El cálculo puede considerar:



```text

Materiales

\+

Mano de obra

\+

Desperdicio

\+

Complejidad

\+

Urgencia

\+

Costos adicionales

\+

Margen

=

Precio sugerido

```



El sistema mostrará el desglose.



Ejemplo:



```text

Materiales             R$150

Mano de obra           R$105

Complejidad             R$30

Urgencia                R$20

────────────────────────────

Costo                   R$305



Margen                  R$95

────────────────────────────

Precio sugerido        R$400

```



\---



\# 14. Rango de precio



En lugar de mostrar solamente un precio, el sistema podrá mostrar:



```text

Precio recomendado:

R$400



Rango:

R$380 – R$450

```



Esto permite que la profesional tome la decisión final.



El sistema funciona como asistente, no como autoridad sobre el precio.



\---



\# 15. Presupuestos



Crear presupuesto para un cliente.



Información:



\* Cliente.

\* Prenda.

\* Servicios.

\* Materiales.

\* Tiempo estimado.

\* Complejidad.

\* Urgencia.

\* Precio.

\* Fecha.

\* Validez.

\* Observaciones.



Estados:



```text

Borrador

Enviado

Aceptado

Rechazado

Vencido

Cancelado

```



\---



\# 16. Presupuesto manual



La profesional podrá modificar el resultado.



Ejemplo:



```text

Precio calculado:

R$420



Precio final:

R$450

```



El sistema debe conservar:



\* Precio calculado.

\* Ajuste manual.

\* Precio final.

\* Motivo opcional.



\---



\# 17. Envío del presupuesto



Generar una presentación del presupuesto para el cliente.



Opciones:



\* WhatsApp.

\* PDF.

\* Link público.



Ejemplo:



```text

Presupuesto #1042



Cliente: María



Vestido de fiesta



Ajustes:

\- Cintura

\- Laterales

\- Largo



Valor:

R$450



Validez:

7 días

```



\---



\# 18. Órdenes de trabajo



Cuando el cliente acepta el presupuesto, puede convertirse en una orden de trabajo.



Estados:



```text

Aceptado

Aguardando prenda

En producción

Aguardando prueba

Ajustes

Listo

Entregado

Cancelado

```



\---



\# 19. Agenda



Calendario para:



\* Entregas.

\* Pruebas.

\* Citas.

\* Retiro de prendas.

\* Fechas límite.



Especialmente importante para vestidos de fiesta y vestidos de novia.



\---



\# 20. Medidas



Guardar medidas por cliente.



Ejemplos:



\* Busto.

\* Cintura.

\* Cadera.

\* Largo.

\* Manga.

\* Hombro.

\* Cuello.



Las medidas pueden tener fecha.



Esto permite mantener histórico:



```text

Medidas 01/2026

Medidas 06/2026

Medidas 09/2026

```



\---



\# 21. Fotografías



Agregar fotografías de:



\* Prenda.

\* Antes.

\* Después.

\* Detalles.

\* Problemas.

\* Referencias del cliente.



Las fotografías estarán asociadas al trabajo correspondiente.



\---



\# 22. Historial de trabajos



Cada trabajo terminado puede registrar:



\* Presupuesto original.

\* Precio final.

\* Material utilizado.

\* Tiempo estimado.

\* Tiempo real.

\* Complejidad.

\* Resultado.

\* Ganancia.



Esto alimentará el sistema inteligente.



\---



\# 23. Sistema de aprendizaje basado en históricos



Con suficientes trabajos registrados, el sistema podrá detectar patrones.



Ejemplo:



```text

Servicio:

Ajuste lateral de vestido



Trabajos:

32



Tiempo estimado promedio:

2h 30m



Tiempo real promedio:

2h 52m



Precio promedio:

R$87

```



El sistema puede utilizar estos datos para mejorar futuras sugerencias.



\---



\# 24. Precio basado en experiencia real



Ejemplo:



La tabla dice:



```text

Ajuste de vestido:

R$70

```



Pero el histórico muestra:



```text

Promedio real:

R$92

```



El sistema puede advertir:



> Los trabajos similares realizados anteriormente tuvieron un costo y tiempo superiores al valor base configurado.



La decisión final continúa siendo de la profesional.



\---



\# 25. Asistente de IA



La IA será opcional y estará orientada a facilitar la entrada de información.



Ejemplo:



> "La cliente quiere reducir la cintura de este vestido, quitarle 8 cm de largo y ajustar un poco los laterales. Es de satén y tiene forro."



La IA identifica:



```text

Prenda:

Vestido



Material:

Satén



Servicios:

\- Ajuste de cintura

\- Ajuste lateral

\- Reducción de largo



Forro:

Sí

```



Después el motor de precios realiza el cálculo.



\### Regla importante



La IA \*\*interpreta y ayuda\*\*.



El motor de negocio \*\*calcula\*\*.



La IA no debe inventar precios.



\---



\# 26. IA con fotografías



En una futura versión:



La profesional podrá fotografiar una prenda y utilizar IA para ayudar a identificar:



\* Tipo de prenda.

\* Material aparente.

\* Elementos.

\* Posibles ajustes.

\* Complejidad aproximada.



La información detectada siempre podrá ser corregida manualmente.



\---



\# 27. WhatsApp



Posibles funcionalidades:



\* Enviar presupuesto.

\* Enviar confirmación.

\* Avisar que la prenda está lista.

\* Recordar una prueba.

\* Recordar una entrega.

\* Compartir link del presupuesto.



La integración oficial de WhatsApp podría incorporarse posteriormente.



\---



\# 28. Pagos



Registrar:



\* Valor total.

\* Anticipo.

\* Saldo.

\* Fecha de pago.

\* Método de pago.



Métodos:



\* Pix.

\* Efectivo.

\* Transferencia.

\* Tarjeta.

\* Otro.



Inicialmente puede ser solamente registro manual.



\---



\# 29. Gastos



Registrar gastos del negocio:



\* Materiales.

\* Herramientas.

\* Transporte.

\* Alquiler.

\* Electricidad.

\* Otros.



Esto permitirá calcular una rentabilidad más real.



\---



\# 30. Rentabilidad



El sistema podrá mostrar:



```text

Trabajo:

Vestido de fiesta



Precio cobrado:

R$450



Materiales:

R$150



Mano de obra:

R$105



Otros costos:

R$30



Ganancia estimada:

R$165

```



\---



\# 31. Configuración



La profesional podrá configurar:



\* Moneda.

\* Idioma.

\* País.

\* Valor/hora.

\* Margen predeterminado.

\* Porcentaje de desperdicio.

\* Recargo por urgencia.

\* Factores de complejidad.

\* Catálogo de servicios.

\* Materiales.

\* Formas de pago.



El sistema no debe estar limitado exclusivamente a Brasil.



\---



\# 32. Multiidioma



Inicialmente:



\* Español.

\* Portugués brasileño.



La arquitectura debe permitir incorporar otros idiomas posteriormente.



\---



\# 33. PWA



La aplicación funcionará como una Progressive Web App.



Permitirá:



\* Instalar en celular.

\* Instalar en computadora.

\* Diseño responsive.

\* Acceso desde navegador.

\* Cámara.

\* Subida de fotografías.

\* Notificaciones cuando sean soportadas.

\* Funcionamiento offline parcial en futuras versiones.



\---



\# 34. MVP



\## Construir inicialmente



\### Clientes



\* Crear.

\* Editar.

\* Historial.



\### Materiales



\* Crear.

\* Precio actual.

\* Historial de precios.



\### Servicios



\* Catálogo.

\* Precio base.

\* Tiempo estimado.



\### Presupuestos



\* Crear.

\* Calcular.

\* Editar.

\* Guardar.

\* Estados.



\### Motor de cálculo



\* Materiales.

\* Mano de obra.

\* Complejidad.

\* Margen.

\* Urgencia.



\### Trabajos



\* Convertir presupuesto en trabajo.

\* Estados.

\* Fecha de entrega.



\### PWA



\* Responsive.

\* Instalación.

\* Autenticación.



\---



\# 35. V1



Después del MVP:



\* WhatsApp.

\* PDF.

\* Link público del presupuesto.

\* Agenda.

\* Medidas.

\* Fotografías.

\* Pagos.

\* Dashboard financiero.

\* Historial avanzado.

\* Análisis de rentabilidad.



\---



\# 36. V2 — Sistema inteligente



Posteriormente:



\* IA para interpretar solicitudes.

\* IA para fotografías.

\* Recomendaciones basadas en históricos.

\* Detección de trabajos subvalorados.

\* Predicción de tiempo.

\* Sugerencia de rango de precio.

\* Análisis de rentabilidad por servicio.

\* Evolución del costo de materiales.



\---



\# 37. Lo que NO construir inicialmente



Para evitar convertir el MVP en un ERP completo:



\* Facturación electrónica.

\* Contabilidad completa.

\* Gestión avanzada de inventario.

\* Marketplace.

\* E-commerce.

\* Gestión de empleados.

\* Nómina.

\* Integraciones bancarias.

\* IA compleja de visión.

\* Automatizaciones avanzadas de WhatsApp.

\* Aplicaciones móviles nativas.



\---



\# 38. Propuesta de valor



El producto no debería venderse simplemente como:



> "Una calculadora para costureras."



La propuesta podría ser:



> \*\*"Calcula cuánto cobrar por cada trabajo basándote en tus costos reales, tiempo de trabajo y experiencia anterior."\*\*



El diferencial estaría en que el sistema \*\*aprende del propio historial de la profesional\*\*, en lugar de depender exclusivamente de una tabla de precios genérica.



\---



\# 39. Arquitectura tecnológica propuesta



\### Frontend



Next.js + TypeScript + Tailwind CSS



\### Aplicación



PWA



\### Hosting



Vercel



\### Backend / Database



Supabase



\* PostgreSQL.

\* Auth.

\* Storage.

\* Row Level Security.

\* Edge Functions.



\### IA



Inicialmente opcional.



Posteriormente:



\* LLM para interpretación.

\* Embeddings solamente si aparece un caso de uso real.

\* Visión para análisis de fotografías.



\---



\# 40. Principio fundamental del sistema



El sistema debe separar claramente:



\*\*IA\*\*



→ interpreta información.



\*\*Motor de negocio\*\*



→ calcula.



\*\*Historial\*\*



→ proporciona datos reales.



\*\*Profesional\*\*



→ toma la decisión final.



El sistema debe ayudar a la costurera a presupuestar mejor, pero nunca convertir una recomendación automática en una obligación.



