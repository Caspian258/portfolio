---
codigo: P01
orden: 1
# BORRADOR: cambiar a true cuando el texto esté aprobado.
aprobado: false
fecha: 2026-10-03
areas: [ciberseguridad, programacion]
stack: [Python 3, csv, argparse, Linux]
repo: https://github.com/Caspian258/Detector
metricas:
  - valor: "197,587"
    es: intentos fallidos analizados
    en: failed attempts analyzed
  - valor: "1,008"
    es: IPs distintas
    en: distinct IPs
  - valor: "481"
    es: IPs sospechosas (3 fallos en 5 min)
    en: suspicious IPs (3 failures in 5 min)
es:
  titulo: Analizador de logs SSH
  resumen: Herramienta de línea de comandos en Python que lee un log de autenticación SSH y señala las IPs que parecen ataques de fuerza bruta.
  problema: Un servidor expuesto a internet recibe miles de intentos de contraseña de bots. En un log de cientos de miles de líneas no se ve a simple vista quién está atacando. La herramienta marca una IP como sospechosa cuando tiene 3 o más eventos «Failed password» dentro de 5 minutos.
  solucion:
    - Se queda solo con las líneas que contienen «Failed password».
    - De cada línea extrae la IP, la hora y el día.
    - Cuenta los fallos por IP y arma, para cada una, la lista de momentos (en segundos) de sus fallos, incluyendo el día para no mezclar fallos de días distintos.
    - Ordena esos momentos y revisa si 3 fallos consecutivos ocurrieron dentro de 300 segundos.
    - Imprime las IPs marcadas y exporta un reporte CSV con las columnas IP, Failures y Suspicious.
  resultados: Sobre el log OpenSSH de Loghub (del 10 de diciembre al 7 de enero), la herramienta encontró 197,587 intentos fallidos desde 1,008 IPs distintas y marcó 481 como sospechosas. La primera versión de la regla comparaba solo la hora del día y marcaba 488; al agregar el día se eliminaron 7 falsos positivos.
  limitaciones:
    - Las líneas del log no traen año; la herramienta cuenta los días desde el 1 de diciembre y supone que el log cruza de diciembre a enero una sola vez.
    - La regla es fija (3 fallos, 300 segundos), así que no detecta ataques lentos. Por ejemplo, 115.71.16.143 tiene 569 intentos fallidos y no queda marcada porque sus primeros intentos están separados por unos 25 minutos.
    - Solo analiza líneas «Failed password»; otros fallos, como «Invalid user» sin intento de contraseña, se ignoran.
  aprendizajes:
    - Trabajar con archivos desde el código y reforzar diccionarios y listas.
    - Usar las librerías csv y argparse; argparse fue mi favorita porque deja que el usuario interactúe con el programa.
    - Lo más difícil fue convertir «3 fallos en 300 segundos» en código y separar la hora y la fecha de cada línea; leer la documentación lo resolvió.
en:
  titulo: SSH log analyzer
  resumen: A Python command-line tool that reads an SSH authentication log and flags the IPs that look like brute-force attacks.
  problema: A server exposed to the internet gets thousands of password attempts from bots. In a log with hundreds of thousands of lines, it is not obvious who is attacking. The tool marks an IP as suspicious when it has 3 or more "Failed password" events within 5 minutes.
  solucion:
    - It keeps only the lines that contain "Failed password".
    - It extracts the IP, the time and the day from each line.
    - It counts failures per IP and builds, for each one, the list of moments (in seconds) of its failures, including the day so failures from different days are never mixed.
    - It sorts those moments and checks whether any 3 consecutive failures happened within 300 seconds.
    - It prints the flagged IPs and exports a CSV report with the columns IP, Failures and Suspicious.
  resultados: On the Loghub OpenSSH log (December 10 to January 7), the tool found 197,587 failed attempts from 1,008 distinct IPs and flagged 481 as suspicious. The first version of the rule compared only the time of day and flagged 488; adding the day removed 7 false positives.
  limitaciones:
    - The log lines have no year; the tool counts days from December 1st and assumes the log crosses from December to January only once.
    - The rule is fixed (3 failures, 300 seconds), so slow attacks are not detected. For example, 115.71.16.143 has 569 failed attempts and is not flagged because its first attempts are about 25 minutes apart.
    - Only "Failed password" lines are analyzed; other failures, such as "Invalid user" lines without a password attempt, are ignored.
  aprendizajes:
    - Working with files from code and reinforcing dictionaries and lists.
    - Using the csv and argparse libraries; argparse was my favorite because it lets the user interact with the program.
    - The hardest part was turning "3 failures in 300 seconds" into code and splitting the time and date out of each line; reading the documentation solved it.
---

Notas internas (no se muestran en el sitio): texto basado en el README de
github.com/Caspian258/Detector. Pendiente de aprobación del autor.
