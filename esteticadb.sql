create table turnos_config
(
	id serial not null
		constraint turnos_config_pkey
			primary key,
	hora_inicio time not null,
	fecha date not null,
	duracion integer not null
)
;

create unique index turnos_config_fecha_uindex
	on turnos_config (fecha)
;

create table agenda
(
	id serial not null
		constraint agenda_pkey
			primary key,
	obvservaciones text,
	costo numeric not null,
	id_medico integer not null,
	id_paciente integer not null,
	id_consultorio integer not null,
	usuario varchar not null,
	id_turno integer not null,
	fecha date not null,
	entreturno boolean not null,
	presente boolean not null,
	atendido boolean not null,
	hora_llegada time
)
;

create table consultorios
(
	id integer not null
		constraint consultorios_pkey
			primary key,
	nombre text not null
)
;

alter table agenda
	add constraint agenda_consultorios_id_fk
		foreign key (id_consultorio) references consultorios
;

create table cuenta_corriente
(
	id serial not null
		constraint cuenta_corriente_pkey
			primary key,
	id_paciente integer not null,
	fecha timestamp not null,
	concepto text,
	monto numeric not null
)
;

create table medicos
(
	id serial not null
		constraint medicos_pkey
			primary key,
	nombre text not null,
	apellido text not null,
	mail text not null
)
;

alter table agenda
	add constraint agenda_medicos_id_fk
		foreign key (id_medico) references medicos
;

create table obras_sociales
(
	id serial not null
		constraint obras_sociales_pkey
			primary key,
	nombre text not null
)
;

create unique index obras_sociales_nombre_uindex
	on obras_sociales (nombre)
;

create table pacientes
(
	id serial not null
		constraint pacientes_pkey
			primary key,
	nombre text,
	apellido text,
	documento text,
	fecha_nacimiento date,
	telefono text,
	mail text,
	sexo char,
	id_os integer not null
		constraint pacientes___fk
			references obras_sociales,
	fecha_alta date,
	domicilio text,
	numero_os text,
	obvservaciones text
)
;

alter table agenda
	add constraint agenda_pacientes_id_fk
		foreign key (id_paciente) references pacientes
;

alter table cuenta_corriente
	add constraint cuenta_corriente_pacientes_id_fk
		foreign key (id_paciente) references pacientes
;

create table roles
(
	id serial not null
		constraint roles_pkey
			primary key,
	nombre varchar(20) not null
)
;

create table tratamientos
(
	id serial not null
		constraint tratamientos_pkey
			primary key,
	nombre text not null,
	costo numeric not null
)
;

create unique index tratamientos_nombre_uindex
	on tratamientos (nombre)
;

create table tratamientos_por_turno
(
	id_agenda integer not null
		constraint tratamientos_por_turno_agenda_id_fk
			references agenda,
	id_tratamiento integer not null
		constraint tratamientos_por_turno_tratamientos_id_fk
			references tratamientos,
	constraint tratamientos_por_turno_pkey
		primary key (id_agenda, id_tratamiento)
)
;

create table turnos
(
	id integer not null
		constraint turnos_pkey
			primary key,
	hora varchar(10)
)
;

alter table agenda
	add constraint agenda_turnos_id_fk
		foreign key (id_turno) references turnos
;

create table usuario_medico
(
	id_medico integer not null
		constraint usuario_medico_medicos_id_fk
			references medicos,
	usuario varchar(20) not null,
	constraint usuario_medico_pkey
		primary key (id_medico, usuario)
)
;

create table usuarios
(
	nombre varchar(20) not null
		constraint usuarios_pkey
			primary key,
	clave text not null,
	id_rol integer not null
		constraint usuarios_roles_id_fk
			references roles
)
;

alter table agenda
	add constraint agenda_usuarios_nombre_fk
		foreign key (usuario) references usuarios
;

alter table usuario_medico
	add constraint usuario_medico_usuarios_nombre_fk
		foreign key (usuario) references usuarios
;

CREATE TABLE public.anulaciones
(
    id SERIAL PRIMARY KEY,
    id_medico INT NOT NULL,
    fecha DATE NOT NULL,
    id_horario_desde INT NOT NULL,
    id_horario_hasta INT NOT NULL,
    observaciones TEXT,
    CONSTRAINT anulaciones_medicos_id_fk FOREIGN KEY (id_medico) REFERENCES medicos (id),
    CONSTRAINT anulaciones_turnos_id_fk_desde FOREIGN KEY (id_horario_desde) REFERENCES turnos (id),
    CONSTRAINT anulaciones_turnos__fk_hasta FOREIGN KEY (id_horario_hasta) REFERENCES turnos (id)
);

create function agenda_atendido(id_agenda_in integer) returns character varying
	language plpgsql
as $$
DECLARE
    agendaExiste INTEGER;
  BEGIN
    SELECT id INTO agendaExiste FROM agenda WHERE id = id_agenda_in;
    IF agendaExiste IS NULL THEN
      RETURN 'error-agenda';
    END IF;
    UPDATE agenda SET atendido = true WHERE id = agendaExiste;
    RETURN 'ok';
  END;
$$
;

create function agenda_borrar_turno(id_agenda_in integer) returns character varying
	language plpgsql
as $$
DECLARE
    agendaExiste INTEGER;
    presenteDb BOOLEAN;
  BEGIN
    SELECT id INTO agendaExiste FROM agenda WHERE id = id_agenda_in;
    IF agendaExiste IS NULL THEN
      RETURN 'error-agenda';
    END IF;
    SELECT presente INTO presenteDb FROM agenda WHERE id = agendaExiste;
    IF presenteDb = TRUE THEN
      RETURN 'error-presente';
    END IF;
    DELETE FROM tratamientos_por_turno WHERE id_agenda = agendaExiste;
    DELETE FROM agenda WHERE id = agendaExiste;
    RETURN 'ok';
  END;
$$
;

create function agenda_nuevo_turno(id_turno_in integer, id_paciente_in integer, id_consultorio_in integer, id_medico_in integer, usuario_in character varying, obvs_in text, costo_in numeric, fecha_in date, entreturno_in boolean) returns character varying
LANGUAGE plpgsql
AS $$
  DECLARE
    turnoExiste INTEGER;
    pacienteExiste INTEGER;
    consultorioExiste INTEGER;
    medicoExiste INTEGER;
    agendaTurnoExiste INTEGER;
    nuevoTurnoAgenda INTEGER;
    medicoDisponibleHora1 INTEGER;
    medicoDisponibleHora2 INTEGER;
  BEGIN
    SELECT id INTO turnoExiste FROM turnos WHERE id = id_turno_in;
    IF turnoExiste IS NULL THEN
      RETURN 'error-turno';
    END IF;
    SELECT id INTO pacienteExiste FROM pacientes WHERE id = id_paciente_in;
    IF pacienteExiste IS NULL THEN
      RETURN 'error-paciente';
    END IF;
    SELECT id INTO consultorioExiste FROM consultorios WHERE id = id_consultorio_in;
    IF consultorioExiste IS NULL THEN
      RETURN 'error-consultorio';
    END IF;
    SELECT id INTO medicoExiste FROM medicos WHERE id = id_medico_in;
    IF medicoExiste IS NULL THEN
      RETURN 'error-medico';
    END IF;
    SELECT id_horario_desde INTO medicoDisponibleHora1 FROM anulaciones WHERE id_medico = medicoExiste AND fecha = fecha_in;
    IF medicoDisponibleHora1 IS NOT NULL THEN
      SELECT id_horario_hasta INTO medicoDisponibleHora2 FROM anulaciones WHERE id_medico = medicoExiste AND fecha = fecha_in;
      IF turnoExiste >= medicoDisponibleHora1 AND turnoExiste <= medicoDisponibleHora2 THEN
        RETURN 'error-anulacion';
      END IF;
    END IF;
    SELECT id INTO agendaTurnoExiste FROM agenda WHERE id_turno = id_turno_in AND id_consultorio = id_consultorio_in
    AND fecha = fecha_in AND agenda.entreturno = entreturno_in;
    IF agendaTurnoExiste IS NOT NULL THEN
      RETURN 'error-agenda';
    END IF;
    INSERT INTO agenda (obvservaciones, costo, id_medico, id_paciente, id_consultorio,
                        usuario, id_turno, fecha, entreturno, presente, atendido)
    VALUES (obvs_in, costo_in, medicoExiste, pacienteExiste, consultorioExiste, usuario_in,
            turnoExiste, fecha_in, entreturno_in, FALSE, FALSE) RETURNING id INTO nuevoTurnoAgenda;
    RETURN CAST(nuevoTurnoAgenda AS CHARACTER VARYING);
  END;

$$;

create function agenda_presente(id_agenda_in integer, presente_in boolean) returns character varying
	language plpgsql
as $$
DECLARE
    agendaExiste INTEGER;
    yaAtendido BOOLEAN;
  BEGIN 
    SELECT id INTO agendaExiste FROM agenda WHERE id = id_agenda_in;
    IF agendaExiste IS NULL THEN
      RETURN 'error-agenda';
    END IF;
    SELECT atendido INTO yaAtendido FROM agenda WHERE id = agendaExiste;
    IF yaAtendido = TRUE THEN
      RETURN 'error-atendido';
    END IF;
    UPDATE agenda SET presente = presente_in, hora_llegada = CURRENT_TIME(0) WHERE id = agendaExiste;
    RETURN 'ok';
  END;
$$
;

create function agenda_turno_tratamiento(id_agenda_in integer, id_tratamiento_in integer) returns character varying
	language plpgsql
as $$
DECLARE
    agendaExiste INTEGER;
    tratamientoExiste INTEGER;
    relacionExiste INTEGER;
  BEGIN
    SELECT id INTO agendaExiste FROM agenda WHERE id = id_agenda_in;
    IF agendaExiste IS NULL THEN
      RETURN 'error-agenda';
    END IF;
    SELECT id INTO tratamientoExiste FROM tratamientos WHERE id = id_tratamiento_in;
    IF tratamientoExiste IS NULL THEN
      RETURN 'error-tratamiento';
    END IF;
    SELECT id_agenda INTO relacionExiste FROM tratamientos_por_turno 
      WHERE id_agenda = agendaExiste AND id_tratamiento = tratamientoExiste;
    IF relacionExiste IS NOT NULL THEN
      RETURN 'error-existe';
    END IF;
    INSERT INTO tratamientos_por_turno (id_agenda, id_tratamiento) VALUES (agendaExiste, tratamientoExiste);
    RETURN 'ok';
  END;
$$
;

create function consultorios_borrar(id_in integer) returns character varying
	language plpgsql
as $$
DECLARE
    consultorioExiste INTEGER;
  BEGIN
    SELECT id INTO consultorioExiste FROM consultorios WHERE id = id_in;
    IF consultorioExiste IS NULL THEN
      RETURN 'error-consultorio';
    ELSE
      DELETE FROM consultorios WHERE id = consultorioExiste;
      RETURN 'ok';
    END IF;
  END;
$$
;

create function consultorios_crear(id_in integer, nombre_in text) returns character varying
	language plpgsql
as $$
DECLARE
    consultorioExiste INTEGER;
  BEGIN
    SELECT id INTO consultorioExiste FROM consultorios WHERE nombre = nombre_in OR id = id_in;
    IF consultorioExiste IS NOT NULL THEN
      RETURN 'error-consultorio';
    ELSE
      INSERT INTO consultorios (id, nombre) VALUES (id_in, nombre_in);
      RETURN 'ok';
    END IF;
  END;
$$
;

create function consultorios_modificar(id_in integer, nombre_in text) returns character varying
	language plpgsql
as $$
DECLARE
    consultorioExiste INTEGER;
    nombreExiste TEXT;
  BEGIN
    SELECT id INTO consultorioExiste FROM consultorios WHERE id = id_in;
    IF consultorioExiste IS NULL THEN
      RETURN 'error-consultorio';
    ELSE
      SELECT nombre INTO nombreExiste FROM consultorios WHERE nombre = nombre_in;
      IF nombreExiste IS NOT NULL THEN
        RETURN 'error-nombre';
      ELSE 
        UPDATE consultorios SET nombre=nombre_in WHERE id = consultorioExiste;
        RETURN 'ok';
      END IF;
    END IF;
  END;
$$
;

create function medico_borrar(id_in integer) returns character varying
	language plpgsql
as $$
DECLARE
    medico_existe INTEGER;
  BEGIN
    SELECT id INTO medico_existe FROM medicos WHERE id = id_in;
    IF medico_existe IS NULL THEN
      RETURN 'error-medico';
    ELSE
      DELETE FROM medicos WHERE id = medico_existe;
      RETURN 'ok';
    END IF;
  END;
$$
;

create function medico_crear(nombre_in text, apellido_in text, mail_in text, color_in text) returns character varying
	language plpgsql
as $$
DECLARE
    mail_existe TEXT;
    nuevo_medico INTEGER;
  BEGIN
    SELECT mail INTO mail_existe FROM medicos WHERE mail = mail_in;
    IF mail_existe IS NOT NULL THEN
      RETURN 'error-mail';
    ELSE 
      INSERT INTO medicos (nombre, apellido, mail, color) VALUES (nombre_in, apellido_in, mail_in, color_in) RETURNING id INTO nuevo_medico;
      RETURN CAST(nuevo_medico AS CHARACTER VARYING);
    END IF;
  END;
$$
;

create function medico_crear_v2(nombre_in text, apellido_in text, mail_in text, usuario_in character varying, clave_in text) returns character varying
	language plpgsql
as $$
DECLARE
    mail_existe TEXT;
    usuario_existe VARCHAR(20);
    rol_medico INTEGER;
    nuevo_medico INTEGER;
  BEGIN
    SELECT mail INTO mail_existe FROM medicos WHERE mail = mail_in;
    IF mail_existe IS NOT NULL THEN
      RETURN 'error-mail';
    END IF;
    SELECT nombre INTO usuario_existe FROM usuarios WHERE nombre = usuario_in;
    IF usuario_existe IS NOT NULL THEN
      RETURN 'error-usuario';
    END IF;
    SELECT id INTO rol_medico FROM roles WHERE nombre = 'medico';
    IF rol_medico IS NULL THEN
      RETURN 'error-rol';
    END IF;
    INSERT INTO usuarios VALUES (usuario_in, clave_in, rol_medico);
    INSERT INTO medicos (nombre, apellido, mail) VALUES (nombre_in, apellido_in, mail_in) RETURNING id INTO nuevo_medico;
    INSERT INTO usuario_medico (id_medico, usuario) VALUES (nuevo_medico, usuario_in);
    RETURN CAST(nuevo_medico AS CHARACTER VARYING);
  END;
$$
;

create function medico_modificar(id_in integer, nombre_in text, apellido_in text, mail_in text, color_in text) returns character varying
	language plpgsql
as $$
DECLARE
    mail_existe TEXT;
    mail_actual TEXT;
    medico_existe INTEGER;
  BEGIN
    SELECT id INTO medico_existe FROM medicos WHERE id = id_in;
    IF medico_existe IS NULL THEN
      RETURN 'error-medico';
    ELSE
      SELECT mail INTO mail_actual FROM medicos WHERE id = medico_existe;
      IF mail_actual != mail_in THEN
        SELECT mail INTO mail_existe FROM medicos WHERE mail = mail_in;
        IF mail_existe IS NOT NULL THEN
          RETURN 'error-mail';
        END IF;
      END IF;
      UPDATE medicos SET nombre=nombre_in, apellido= apellido_in, mail=mail_in, color=color_in WHERE id = medico_existe;
      RETURN 'ok';
    END IF;

  END;
$$
;

create function medico_turno_atendido(id_agenda_in integer, usuario_medico_in character varying) returns character varying
	language plpgsql
as $$
DECLARE
    turnoExiste INTEGER;
    pacientePresente BOOLEAN;
    fechaTurno DATE;
  BEGIN
    SELECT agenda.id INTO turnoExiste FROM agenda
    INNER JOIN medicos ON agenda.id_medico = medicos.id
    INNER JOIN usuario_medico ON medicos.id = usuario_medico.id_medico
    INNER JOIN usuarios ON usuario_medico.usuario = usuarios.nombre
    WHERE usuarios.nombre = usuario_medico_in AND agenda.id = id_agenda_in;
    IF turnoExiste IS NULL THEN
      RETURN 'error-turno';
    END IF;
    SELECT presente INTO pacientePresente FROM agenda WHERE id = turnoExiste;
    IF pacientePresente = FALSE THEN
      RETURN 'error-paciente';
    END IF;
    SELECT fecha INTO fechaTurno FROM agenda WHERE id = turnoExiste;
    IF fechaTurno != CURRENT_DATE THEN
      RETURN 'error-fecha';
    END IF;
    UPDATE agenda SET atendido = true WHERE id = turnoExiste;
    RETURN 'ok';
  END;
$$
;

create function medicos_crear_anulacion(id_medico_in INTEGER, fecha_in DATE, id_hr_desde_in INTEGER, id_hr_hasta_in INTEGER, observaciones_in TEXT)
  returns CHARACTER VARYING LANGUAGE plpgsql AS $$
  DECLARE
    medicoExiste INTEGER;
    horarioExiste1 INTEGER;
    horarioExiste2 INTEGER;
    anulacionExiste INTEGER;
  BEGIN
    SELECT id INTO medicoExiste FROM medicos WHERE id = id_medico_in;
    IF medicoExiste IS NULL THEN
      RETURN 'error-medico';
    END IF;
    SELECT id INTO horarioExiste1 FROM turnos WHERE id = id_hr_desde_in;
    IF horarioExiste1 IS NULL THEN
      RETURN 'error-desde';
    END IF;
    IF id_hr_desde_in > id_hr_hasta_in THEN
      RETURN 'error-rango';
    END IF;
    SELECT id INTO horarioExiste2 FROM turnos WHERE id = id_hr_hasta_in;
    IF horarioExiste2 IS NULL THEN
      RETURN 'error-hasta';
    END IF;
    SELECT id INTO anulacionExiste FROM anulaciones WHERE fecha = fecha_in;
    IF anulacionExiste IS NOT NULL THEN
      RETURN 'error-anulacion';
    END IF;
    INSERT INTO anulaciones (id_medico, fecha, id_horario_desde, id_horario_hasta, observaciones)
      VALUES (medicoExiste, fecha_in, horarioExiste1, horarioExiste2, observaciones_in);
    RETURN 'ok';
  END;
  $$

create function obra_social_borrar(id_in integer) returns character varying
	language plpgsql
as $$
DECLARE
    obraExiste INTEGER;
    obraEnUso INTEGER;
  BEGIN
    SELECT id INTO obraExiste FROM obras_sociales WHERE id = id_in;
    IF obraExiste IS NULL THEN
      RETURN 'error-obra';
    ELSE
      SELECT COUNT(*) INTO obraEnUso FROM pacientes WHERE id_os = obraExiste;
      IF obraEnUso > 0 THEN
        RETURN 'error-pacientes';
      ELSE
        DELETE FROM obras_sociales WHERE id = obraExiste;
        RETURN 'ok';
      END IF;
    END IF;
  END;
$$
;

create function obra_social_crear(nombre_in text) returns character varying
	language plpgsql
as $$
DECLARE
    obraExiste INTEGER;
  BEGIN
    SELECT id INTO obraExiste FROM obras_sociales WHERE nombre = nombre_in;
    IF obraExiste IS NOT NULL THEN
      RETURN 'error-obra';
    ELSE
      INSERT INTO obras_sociales (nombre) VALUES (nombre_in) RETURNING id INTO obraExiste;
      RETURN CAST(obraExiste AS CHARACTER VARYING);
    END IF;
  END;
$$
;

create function obra_social_modificar(id_in integer, nuevo_nombre_in text) returns character varying
	language plpgsql
as $$
DECLARE
    obraExiste INTEGER;
    obraNuevaExiste INTEGER;
  BEGIN
    SELECT id INTO obraExiste FROM obras_sociales WHERE id = id_in;
    IF obraExiste IS NULL THEN
      RETURN 'error-obra';
    ELSE
      SELECT id INTO obraNuevaExiste FROM obras_sociales WHERE nombre = nuevo_nombre_in;
      IF obraNuevaExiste IS NOT NULL THEN
        RETURN 'error-existe';
      ELSE
        UPDATE obras_sociales SET nombre = nuevo_nombre_in WHERE id = obraExiste;
        RETURN 'ok';
      END IF;
    END IF;
  END;
$$
;

create function paciente_borrar(id_in integer) returns character varying
	language plpgsql
as $$
DECLARE
    paciente_existe INTEGER;
  BEGIN
    SELECT id INTO paciente_existe FROM pacientes WHERE id = id_in;
    IF paciente_existe IS NULL THEN
      RETURN 'error-paciente';
    ELSE
      DELETE FROM pacientes WHERE id = paciente_existe;
      RETURN 'ok';
    END IF;
  END;
$$
;

create function paciente_crear(nom_in text, ape_in text, dni_in text, fecha_in date, tel_in text, mail_in text, sexo_in character, id_os_in integer, numero_os_in text, domicilio_in text, obs_in text) returns character varying
	language plpgsql
as $$
DECLARE
    os_existe INTEGER;
    dni_existe TEXT;
    paciente_nuevo INTEGER;
  BEGIN
    SELECT into dni_existe documento FROM pacientes WHERE documento = dni_in;
    IF dni_existe IS NOT NULL THEN
      RETURN 'error-paciente';
    ELSE 
      SELECT into os_existe id FROM obras_sociales WHERE id = id_os_in;
      IF os_existe IS NULL THEN
        RETURN 'error-os';
      ELSE 
        INSERT INTO pacientes (nombre, apellido, documento, fecha_nacimiento, telefono, mail, sexo, id_os, fecha_alta, domicilio, numero_os, obvservaciones)
          VALUES (nom_in, ape_in, dni_in, fecha_in, tel_in, mail_in, sexo_in, os_existe, CURRENT_DATE, domicilio_in, numero_os_in, obs_in) RETURNING id INTO paciente_nuevo;
        RETURN CAST(paciente_nuevo AS CHARACTER VARYING);
      END IF;
    END IF;
  END;
$$
;

create function paciente_crear_v2(nom_in text, ape_in text, dni_in text, fecha_in date, tel_in text, mail_in text, sexo_in character, os_in text, numero_os_in text, domicilio_in text, obs_in text, fecha_alta_in date) returns character varying
	language plpgsql
as $$
DECLARE
    os_existe INTEGER;
    dni_existe TEXT;
    paciente_nuevo INTEGER;
  BEGIN
    SELECT into dni_existe documento FROM pacientes WHERE documento = dni_in;
    IF dni_existe IS NOT NULL THEN
      RETURN 'error-paciente';
    ELSE
      SELECT into os_existe id FROM obras_sociales WHERE nombre = os_in;
      IF os_existe IS NULL THEN
        RETURN 'error-os';
      END IF;
      INSERT INTO pacientes (nombre, apellido, documento, fecha_nacimiento, telefono, mail, sexo, id_os, fecha_alta, domicilio, numero_os, obvservaciones)
        VALUES (nom_in, ape_in, dni_in, fecha_in, tel_in, mail_in, sexo_in, os_existe, fecha_alta_in, domicilio_in, numero_os_in, obs_in) RETURNING id INTO paciente_nuevo;
      RETURN 'ok';
    END IF;
  END;
$$
;

create function paciente_modificar(id_in integer, nom_in text, ape_in text, dni_in text, fecha_in date, tel_in text, mail_in text, sexo_in character, id_os_in integer, numero_os_in text, domicilio_in text, obs_in text) returns character varying
	language plpgsql
as $$
DECLARE
    os_existe INTEGER;
    dni_existe TEXT;
    dni_paciente TEXT;
    paciente_existe INTEGER;
  BEGIN
    SELECT id INTO paciente_existe FROM pacientes WHERE id = id_in;
    IF paciente_existe IS NULL THEN
      RETURN 'error-paciente';
    ELSE
      SELECT documento INTO dni_paciente FROM pacientes WHERE id = paciente_existe;
      IF dni_paciente != dni_in THEN
        SELECT documento into dni_existe FROM pacientes WHERE documento = dni_in;
        IF dni_existe IS NOT NULL THEN
          RETURN 'error-dni';
        END IF;
      END IF;
      SELECT into os_existe id FROM obras_sociales WHERE id = id_os_in;
        IF os_existe IS NULL THEN
          RETURN 'error-os';
        ELSE
          UPDATE pacientes SET nombre=nom_in, apellido=ape_in, documento=dni_in, fecha_nacimiento = fecha_in,
            telefono=tel_in, mail=mail_in, sexo=sexo_in, id_os=os_existe, numero_os=numero_os_in, 
            domicilio=domicilio_in, obvservaciones=obs_in WHERE id = paciente_existe;
          RETURN 'ok';
        END IF;
    END IF;
  END;
$$
;

create function rol_borrar(nombre_in character varying) returns character varying
	language plpgsql
as $$
DECLARE
    rol_existe INTEGER;
    usuarios_roles INTEGER;
  BEGIN
    SELECT id INTO rol_existe FROM roles WHERE nombre = nombre_in;
    IF rol_existe IS NULL THEN
      RETURN 'error-rol';
    ELSE
      SELECT COUNT(*) INTO usuarios_roles FROM usuarios WHERE id_rol = rol_existe;
      IF usuarios_roles > 0 THEN
        RETURN 'error-usuarios';
      ELSE 
        DELETE FROM roles WHERE id = rol_existe;
        RETURN 'ok';
      END IF;
    END IF;
  END;
$$
;

create function rol_crear(nombre_in character varying) returns character varying
	language plpgsql
as $$
DECLARE
    rol_existe INTEGER;
  BEGIN
    SELECT id INTO rol_existe FROM roles WHERE nombre = nombre_in;
    IF rol_existe IS NOT NULL THEN
      RETURN 'error-rol';
    ELSE 
      INSERT INTO roles (nombre) VALUES (nombre_in) RETURNING id INTO rol_existe;
      RETURN CAST(rol_existe AS CHARACTER VARYING);
    END IF;
  END;
$$
;

create function rol_modificar(nombre_in text, nuevo_nombre_in text) returns character varying
	language plpgsql
as $$
DECLARE
    rolExiste INTEGER;
    nuevoRolExiste INTEGER;
  BEGIN
    SELECT id INTO rolExiste FROM roles WHERE nombre = nombre_in;
    IF rolExiste IS NULL THEN
      RETURN 'error-rol';
    ELSE
      SELECT id INTO nuevoRolExiste FROM roles WHERE nombre = nuevo_nombre_in;
      IF nuevoRolExiste IS NOT NULL THEN
        RETURN 'error-existe';
      ELSE
        UPDATE roles SET nombre = nuevo_nombre_in WHERE id = rolExiste;
        RETURN 'ok';
      END IF;
    END IF;
  END;
$$
;

create function tratamientos_borrar(id_in integer) returns character varying
	language plpgsql
as $$
DECLARE
    tratamientoExiste INTEGER;
  BEGIN
    SELECT id INTO tratamientoExiste FROM tratamientos WHERE id = id_in;
    IF tratamientoExiste IS NULL THEN
      RETURN 'error-tratamiento';
    ELSE 
      DELETE FROM tratamientos WHERE id = tratamientoExiste;
      RETURN 'ok';
    END IF;
  END;
$$
;

create function tratamientos_crear(nombre_in text, costo_in numeric) returns character varying
	language plpgsql
as $$
DECLARE
    nombreTratamientoExiste TEXT;
  BEGIN 
    SELECT nombre INTO nombreTratamientoExiste FROM tratamientos WHERE nombre = nombre_in;
    IF nombreTratamientoExiste IS NOT NULL THEN
      RETURN 'error-nombre';
    ELSE 
      INSERT INTO tratamientos (nombre, costo) VALUES (nombre_in, costo_in);
      RETURN 'ok';
    END IF;
  END;
$$
;

create function tratamientos_modificar(id_in integer, nombre_in text, costo_in numeric) returns character varying
	language plpgsql
as $$
DECLARE
    nombreTratamientoExiste TEXT;
    tratamientoExiste INTEGER;
    nombreActual TEXT;
  BEGIN
    SELECT id INTO tratamientoExiste FROM tratamientos WHERE id = id_in;
    IF tratamientoExiste IS NULL THEN
      RETURN 'error-tratamiento';
    ELSE
      SELECT nombre INTO nombreActual FROM tratamientos WHERE id = tratamientoExiste;
      IF nombre_in != nombreActual THEN
        SELECT nombre INTO nombreTratamientoExiste FROM tratamientos WHERE nombre = nombre_in;
        IF nombreTratamientoExiste IS NOT NULL THEN
          RETURN 'error-nombre';
        END IF;
      END IF;
      UPDATE tratamientos SET nombre=nombre_in, costo=costo_in WHERE id = tratamientoExiste;
      RETURN 'ok';
    END IF;
  END;
$$
;

create function turnos_crear_configuracion(hora_inicio_in time without time zone, duracion_in integer, fecha_in date) returns character varying
	language plpgsql
as $$
DECLARE
  fechaExiste DATE;
  configNueva INTEGER;
BEGIN
  SELECT fecha INTO fechaExiste FROM turnos_config WHERE fecha = fecha_in;
  IF fechaExiste IS NOT NULL THEN
    RETURN 'error-fecha';
  ELSE
    IF CAST(fecha_in AS DATE) < CURRENT_DATE THEN
      RETURN 'error-pasado';
    ELSE
      INSERT INTO turnos_config (hora_inicio, fecha, duracion) VALUES (hora_inicio_in, fecha_in, duracion_in)
      RETURNING id INTO configNueva;
      RETURN CAST(configNueva AS CHARACTER VARYING);
    END IF;
    
  END IF;
END;
$$
;

create function turnos_ver_configuracion() returns SETOF turnos_config
	language plpgsql
as $$
BEGIN
    RETURN QUERY SELECT * FROM turnos_config WHERE fecha <= CURRENT_DATE ORDER BY fecha DESC LIMIT 1;
  END;
$$
;

create function usuario_borrar(usuario_in character varying) returns character varying
	language plpgsql
as $$
DECLARE
    usuario_existe VARCHAR(20);
  BEGIN
    SELECT nombre INTO usuario_existe FROM usuarios WHERE nombre = usuario_in;
    IF usuario_existe IS NULL THEN
      RETURN 'error-usuario';
    ELSE
      DELETE FROM usuarios WHERE nombre = usuario_existe;
      RETURN 'ok';
    END IF;
  END;
$$
;

create function usuario_crear(usuario_in character varying, clave_in text, rol_in character varying) returns character varying
	language plpgsql
as $$
DECLARE
    rol_existe INTEGER;
    usuario_existe VARCHAR(20);
  BEGIN
    SELECT nombre INTO usuario_existe FROM usuarios WHERE nombre = usuario_in;
    IF usuario_existe IS NULL THEN
      SELECT id INTO rol_existe FROM roles WHERE nombre = rol_in;
      IF rol_existe IS NULL THEN
        RETURN 'error-rol';
      END IF;
      INSERT INTO usuarios (nombre, clave, id_rol) VALUES (usuario_in, clave_in, rol_existe);
      RETURN 'ok';
    ELSE
      RETURN 'error-usuario';
    END IF;
  END;
$$
;

create function usuario_modificar_clave(usuario_in character varying, clave_in text, nueva_clave_in text) returns character varying
	language plpgsql
as $$
DECLARE
    usuario_existe VARCHAR(20);
  BEGIN
    SELECT nombre INTO usuario_existe FROM usuarios WHERE nombre = usuario_in AND clave = clave_in;
    IF usuario_existe IS NULL THEN
      RETURN 'error-usuario-clave';
    ELSE
      IF clave_in == nueva_clave_in THEN
        RETURN 'error-clave';
      END IF;
      UPDATE usuarios SET clave = nueva_clave_in WHERE nombre = usuario_existe;
      RETURN 'ok';
    END IF;
  END;
$$
;

create function usuario_modificar_rol(usuario_in character varying, rol_in character varying) returns character varying
	language plpgsql
as $$
DECLARE
    usuario_existe VARCHAR(20);
    rol_existe INTEGER;
  BEGIN
    SELECT nombre INTO usuario_existe FROM usuarios WHERE nombre = usuario_in;
    IF usuario_existe IS NULL THEN
      RETURN 'error-usuario';
    ELSE
      SELECT id INTO rol_existe FROM roles WHERE nombre = rol_in;
      IF rol_existe IS NULL THEN
        RETURN 'error-rol';
      ELSE
        UPDATE usuarios SET id_rol = rol_existe WHERE nombre = usuario_existe;
      RETURN 'ok';
      END IF;
    END IF;
  END;
$$
;

create function agenda_importar_turno(id_medico_in integer, textpaciente_in text, horaturno_in text, id_consultorio_in integer, enteturno_in boolean, costo_in numeric, obs_in text, fecha_in date) returns character varying
	language plpgsql
as $$
DECLARE
    pacienteExiste INTEGER;
    horarioExiste INTEGER;
  BEGIN
    SELECT id INTO pacienteExiste FROM pacientes WHERE CONCAT(apellido, ' ', nombre) ILIKE textpaciente_in;
    IF pacienteExiste IS NULL THEN
      RETURN 'error-paciente';
    END IF;
    IF id_medico_in = 0 THEN
      RETURN 'error-medico';
    END IF;
    SELECT id INTO horarioExiste FROM turnos WHERE hora = horaturno_in;
    IF horarioExiste IS NULL THEN
      RETURN 'eror-horario';
    END IF;
    INSERT INTO agenda (obvservaciones, costo, id_medico, id_paciente,
                        id_consultorio, usuario, id_turno, fecha, entreturno, presente, atendido, hora_llegada) VALUES
      (obs_in, costo_in, id_medico_in, pacienteExiste, id_consultorio_in, 'admin', horarioExiste,
       fecha_in, enteturno_in, false, false, null);
    RETURN 'ok';
  END;
$$
;

