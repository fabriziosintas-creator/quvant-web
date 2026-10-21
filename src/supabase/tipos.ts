export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      acompanamientos: {
        Row: {
          alerta_id: string | null
          cliente_id: string
          creado_en: string
          es_prueba: boolean
          fecha: string
          id: string
          nota: string | null
          quien: string | null
          tipo: string
        }
        Insert: {
          alerta_id?: string | null
          cliente_id: string
          creado_en?: string
          es_prueba?: boolean
          fecha?: string
          id?: string
          nota?: string | null
          quien?: string | null
          tipo: string
        }
        Update: {
          alerta_id?: string | null
          cliente_id?: string
          creado_en?: string
          es_prueba?: boolean
          fecha?: string
          id?: string
          nota?: string | null
          quien?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "acompanamientos_alerta_id_fkey"
            columns: ["alerta_id"]
            isOneToOne: false
            referencedRelation: "alertas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acompanamientos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes_sistema"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acompanamientos_quien_fkey"
            columns: ["quien"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      alertas: {
        Row: {
          cliente_id: string
          detalle: Json
          es_prueba: boolean
          estado: string
          fecha: string
          funcion_clave: string | null
          gravedad: string
          id: string
          resolucion: string | null
          resuelta_en: string | null
          resuelta_por: string | null
          tipo: string
        }
        Insert: {
          cliente_id: string
          detalle?: Json
          es_prueba?: boolean
          estado?: string
          fecha?: string
          funcion_clave?: string | null
          gravedad?: string
          id?: string
          resolucion?: string | null
          resuelta_en?: string | null
          resuelta_por?: string | null
          tipo: string
        }
        Update: {
          cliente_id?: string
          detalle?: Json
          es_prueba?: boolean
          estado?: string
          fecha?: string
          funcion_clave?: string | null
          gravedad?: string
          id?: string
          resolucion?: string | null
          resuelta_en?: string | null
          resuelta_por?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "alertas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes_sistema"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alertas_resuelta_por_fkey"
            columns: ["resuelta_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      analisis_claude: {
        Row: {
          alcance: string
          cliente_id: string | null
          creado_en: string
          dia: string
          id: number
          modelo: string
          nucleo_id: string | null
          respuesta: Json
        }
        Insert: {
          alcance: string
          cliente_id?: string | null
          creado_en?: string
          dia?: string
          id?: never
          modelo: string
          nucleo_id?: string | null
          respuesta: Json
        }
        Update: {
          alcance?: string
          cliente_id?: string | null
          creado_en?: string
          dia?: string
          id?: never
          modelo?: string
          nucleo_id?: string | null
          respuesta?: Json
        }
        Relationships: [
          {
            foreignKeyName: "analisis_claude_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes_sistema"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analisis_claude_nucleo_id_fkey"
            columns: ["nucleo_id"]
            isOneToOne: false
            referencedRelation: "nucleos"
            referencedColumns: ["id"]
          },
        ]
      }
      avances_manuales: {
        Row: {
          cargado_por: string | null
          creado_en: string
          es_prueba: boolean
          fecha: string
          id: number
          meta_id: string
          nota: string | null
          valor: number
        }
        Insert: {
          cargado_por?: string | null
          creado_en?: string
          es_prueba?: boolean
          fecha?: string
          id?: never
          meta_id: string
          nota?: string | null
          valor: number
        }
        Update: {
          cargado_por?: string | null
          creado_en?: string
          es_prueba?: boolean
          fecha?: string
          id?: never
          meta_id?: string
          nota?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "avances_manuales_cargado_por_fkey"
            columns: ["cargado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avances_manuales_meta_id_fkey"
            columns: ["meta_id"]
            isOneToOne: false
            referencedRelation: "metas"
            referencedColumns: ["id"]
          },
        ]
      }
      avisos: {
        Row: {
          clave: string
          creado_en: string
          enlace: string | null
          es_prueba: boolean
          id: number
          para_perfil: string | null
          prioridad: string
          texto: string | null
          tipo: string
          titulo: string
        }
        Insert: {
          clave: string
          creado_en?: string
          enlace?: string | null
          es_prueba?: boolean
          id?: number
          para_perfil?: string | null
          prioridad?: string
          texto?: string | null
          tipo: string
          titulo: string
        }
        Update: {
          clave?: string
          creado_en?: string
          enlace?: string | null
          es_prueba?: boolean
          id?: number
          para_perfil?: string | null
          prioridad?: string
          texto?: string | null
          tipo?: string
          titulo?: string
        }
        Relationships: []
      }
      avisos_leidos: {
        Row: {
          aviso_id: number
          leido_en: string
          perfil_id: string
        }
        Insert: {
          aviso_id: number
          leido_en?: string
          perfil_id: string
        }
        Update: {
          aviso_id?: number
          leido_en?: string
          perfil_id?: string
        }
        Relationships: []
      }
      avisos_preferencias: {
        Row: {
          actualizado_en: string
          apagados: string[]
          perfil_id: string
          por_whatsapp: string[]
        }
        Insert: {
          actualizado_en?: string
          apagados?: string[]
          perfil_id: string
          por_whatsapp?: string[]
        }
        Update: {
          actualizado_en?: string
          apagados?: string[]
          perfil_id?: string
          por_whatsapp?: string[]
        }
        Relationships: []
      }
      clientes_plantilla: {
        Row: {
          abono_mensual: number | null
          actualizado_en: string
          cargado_por: string | null
          creado_en: string
          empresa: string
          es_prueba: boolean
          estado: Database["public"]["Enums"]["estado_cliente"]
          fecha_alta: string | null
          fecha_baja: string | null
          fecha: string
          id: string
          local_id: string | null
          motivo_baja: string | null
          nicho_id: string
          notas: string | null
        }
        Insert: {
          abono_mensual?: number | null
          actualizado_en?: string
          cargado_por?: string | null
          creado_en?: string
          empresa: string
          es_prueba?: boolean
          estado?: Database["public"]["Enums"]["estado_cliente"]
          fecha_alta?: string | null
          fecha_baja?: string | null
          fecha?: string
          id?: string
          local_id?: string | null
          motivo_baja?: string | null
          nicho_id: string
          notas?: string | null
        }
        Update: {
          abono_mensual?: number | null
          actualizado_en?: string
          cargado_por?: string | null
          creado_en?: string
          empresa?: string
          es_prueba?: boolean
          estado?: Database["public"]["Enums"]["estado_cliente"]
          fecha_alta?: string | null
          fecha_baja?: string | null
          fecha?: string
          id?: string
          local_id?: string | null
          motivo_baja?: string | null
          nicho_id?: string
          notas?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clientes_plantilla_cargado_por_fkey"
            columns: ["cargado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clientes_plantilla_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clientes_plantilla_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locales_resumen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clientes_plantilla_nicho_id_fkey"
            columns: ["nicho_id"]
            isOneToOne: false
            referencedRelation: "nichos"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes_sistema: {
        Row: {
          actualizado_en: string
          alta: string
          baja: string | null
          cliente_plantilla_id: string | null
          comparte_metricas: boolean
          creado_en: string
          es_prueba: boolean
          id: string
          modulos_activos: string[]
          motivo_baja: string | null
          nombre: string
          nota_baja: string | null
          nucleo_id: string
          organizacion_id: string
          plan: string | null
          responsable: string
          sucursales_contratadas: number
          usuarios_contratados: number
        }
        Insert: {
          actualizado_en?: string
          alta?: string
          baja?: string | null
          cliente_plantilla_id?: string | null
          comparte_metricas?: boolean
          creado_en?: string
          es_prueba?: boolean
          id?: string
          modulos_activos?: string[]
          motivo_baja?: string | null
          nombre: string
          nota_baja?: string | null
          nucleo_id: string
          organizacion_id: string
          plan?: string | null
          responsable?: string
          sucursales_contratadas?: number
          usuarios_contratados?: number
        }
        Update: {
          actualizado_en?: string
          alta?: string
          baja?: string | null
          cliente_plantilla_id?: string | null
          comparte_metricas?: boolean
          creado_en?: string
          es_prueba?: boolean
          id?: string
          modulos_activos?: string[]
          motivo_baja?: string | null
          nombre?: string
          nota_baja?: string | null
          nucleo_id?: string
          organizacion_id?: string
          plan?: string | null
          responsable?: string
          sucursales_contratadas?: number
          usuarios_contratados?: number
        }
        Relationships: [
          {
            foreignKeyName: "clientes_sistema_cliente_plantilla_id_fkey"
            columns: ["cliente_plantilla_id"]
            isOneToOne: false
            referencedRelation: "clientes_plantilla"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clientes_sistema_nucleo_id_fkey"
            columns: ["nucleo_id"]
            isOneToOne: false
            referencedRelation: "nucleos"
            referencedColumns: ["id"]
          },
        ]
      }
      cobros_quvant: {
        Row: {
          actualizado_en: string
          cargado_por: string | null
          cliente: string
          cliente_plantilla_id: string | null
          cobrado: boolean
          creado_en: string
          es_prueba: boolean
          factura: string | null
          fecha: string
          id: string
          iva_incluido: boolean
          monto_ars: number
          nicho_id: string | null
          nota: string | null
          tipo: string
        }
        Insert: {
          actualizado_en?: string
          cargado_por?: string | null
          cliente: string
          cliente_plantilla_id?: string | null
          cobrado?: boolean
          creado_en?: string
          es_prueba?: boolean
          factura?: string | null
          fecha?: string
          id?: string
          iva_incluido?: boolean
          monto_ars: number
          nicho_id?: string | null
          nota?: string | null
          tipo: string
        }
        Update: {
          actualizado_en?: string
          cargado_por?: string | null
          cliente?: string
          cliente_plantilla_id?: string | null
          cobrado?: boolean
          creado_en?: string
          es_prueba?: boolean
          factura?: string | null
          fecha?: string
          id?: string
          iva_incluido?: boolean
          monto_ars?: number
          nicho_id?: string | null
          nota?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "cobros_quvant_cargado_por_fkey"
            columns: ["cargado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cobros_quvant_cliente_plantilla_id_fkey"
            columns: ["cliente_plantilla_id"]
            isOneToOne: false
            referencedRelation: "clientes_plantilla"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cobros_quvant_nicho_id_fkey"
            columns: ["nicho_id"]
            isOneToOne: false
            referencedRelation: "nichos"
            referencedColumns: ["id"]
          },
        ]
      }
      eventos: {
        Row: {
          creado_en: string
          detalle: string | null
          id: number
          nicho_id: string | null
          pagina: string | null
          perfil_id: string | null
          tipo: Database["public"]["Enums"]["tipo_evento"]
          visita_id: string | null
        }
        Insert: {
          creado_en?: string
          detalle?: string | null
          id?: never
          nicho_id?: string | null
          pagina?: string | null
          perfil_id?: string | null
          tipo: Database["public"]["Enums"]["tipo_evento"]
          visita_id?: string | null
        }
        Update: {
          creado_en?: string
          detalle?: string | null
          id?: never
          nicho_id?: string | null
          pagina?: string | null
          perfil_id?: string | null
          tipo?: Database["public"]["Enums"]["tipo_evento"]
          visita_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eventos_nicho_id_fkey"
            columns: ["nicho_id"]
            isOneToOne: false
            referencedRelation: "nichos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      geocodificaciones: {
        Row: {
          clave: string
          creado_en: string
          resultado: Json
        }
        Insert: {
          clave: string
          creado_en?: string
          resultado: Json
        }
        Update: {
          clave?: string
          creado_en?: string
          resultado?: Json
        }
        Relationships: []
      }
      hoy_pospuestas: {
        Row: {
          clave: string
          creado_en: string
          hasta: string
          perfil_id: string
        }
        Insert: {
          clave: string
          creado_en?: string
          hasta: string
          perfil_id: string
        }
        Update: {
          clave?: string
          creado_en?: string
          hasta?: string
          perfil_id?: string
        }
        Relationships: []
      }
      indicadores_diarios: {
        Row: {
          cliente_id: string
          creado_en: string
          datos: Json
          dia: string
          id: number
          salud: number | null
          semaforo: string | null
        }
        Insert: {
          cliente_id: string
          creado_en?: string
          datos: Json
          dia: string
          id?: never
          salud?: number | null
          semaforo?: string | null
        }
        Update: {
          cliente_id?: string
          creado_en?: string
          datos?: Json
          dia?: string
          id?: never
          salud?: number | null
          semaforo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "indicadores_diarios_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes_sistema"
            referencedColumns: ["id"]
          },
        ]
      }
      locales: {
        Row: {
          actualizado_en: string
          cargado_por: string | null
          ciudad: string | null
          clave_cliente: string | null
          contacto: string | null
          creado_en: string
          direccion_normalizada: string | null
          direccion: string | null
          es_prueba: boolean
          estado: Database["public"]["Enums"]["estado_local"]
          id: string
          latitud: number | null
          link_google_maps: string | null
          longitud: number | null
          nicho_id: string | null
          nombre: string
          origen: Database["public"]["Enums"]["origen_local"]
          osm_id: string | null
          provincia: string | null
          proxima_visita: string | null
          rubro: string | null
          telefono: string | null
          ubicacion_pendiente: boolean
          volver: Database["public"]["Enums"]["volver"] | null
          web: string | null
        }
        Insert: {
          actualizado_en?: string
          cargado_por?: string | null
          ciudad?: string | null
          clave_cliente?: string | null
          contacto?: string | null
          creado_en?: string
          direccion_normalizada?: string | null
          direccion?: string | null
          es_prueba?: boolean
          estado?: Database["public"]["Enums"]["estado_local"]
          id?: string
          latitud?: number | null
          link_google_maps?: string | null
          longitud?: number | null
          nicho_id?: string | null
          nombre: string
          origen?: Database["public"]["Enums"]["origen_local"]
          osm_id?: string | null
          provincia?: string | null
          proxima_visita?: string | null
          rubro?: string | null
          telefono?: string | null
          ubicacion_pendiente?: boolean
          volver?: Database["public"]["Enums"]["volver"] | null
          web?: string | null
        }
        Update: {
          actualizado_en?: string
          cargado_por?: string | null
          ciudad?: string | null
          clave_cliente?: string | null
          contacto?: string | null
          creado_en?: string
          direccion_normalizada?: string | null
          direccion?: string | null
          es_prueba?: boolean
          estado?: Database["public"]["Enums"]["estado_local"]
          id?: string
          latitud?: number | null
          link_google_maps?: string | null
          longitud?: number | null
          nicho_id?: string | null
          nombre?: string
          origen?: Database["public"]["Enums"]["origen_local"]
          osm_id?: string | null
          provincia?: string | null
          proxima_visita?: string | null
          rubro?: string | null
          telefono?: string | null
          ubicacion_pendiente?: boolean
          volver?: Database["public"]["Enums"]["volver"] | null
          web?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "locales_cargado_por_fkey"
            columns: ["cargado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locales_nicho_id_fkey"
            columns: ["nicho_id"]
            isOneToOne: false
            referencedRelation: "nichos"
            referencedColumns: ["id"]
          },
        ]
      }
      metas: {
        Row: {
          actualizado_en: string
          acumulacion: string
          archivada: boolean
          area: string
          clave_plan: string | null
          creado_en: string
          creado_por: string | null
          descripcion: string | null
          desde: string
          direccion: string
          es_prueba: boolean
          etapa: string
          filtros: Json
          hasta: string
          id: string
          meta_original: number
          meta_valor: number
          metrica: string
          nombre: string
          orden: number
          repite_de: string | null
          responsable: string
          se_repite: boolean
          tipo_periodo: string
          unidad: string
        }
        Insert: {
          actualizado_en?: string
          acumulacion: string
          archivada?: boolean
          area: string
          clave_plan?: string | null
          creado_en?: string
          creado_por?: string | null
          descripcion?: string | null
          desde: string
          direccion?: string
          es_prueba?: boolean
          etapa?: string
          filtros?: Json
          hasta: string
          id?: string
          meta_original: number
          meta_valor: number
          metrica: string
          nombre: string
          orden?: number
          repite_de?: string | null
          responsable?: string
          se_repite?: boolean
          tipo_periodo: string
          unidad: string
        }
        Update: {
          actualizado_en?: string
          acumulacion?: string
          archivada?: boolean
          area?: string
          clave_plan?: string | null
          creado_en?: string
          creado_por?: string | null
          descripcion?: string | null
          desde?: string
          direccion?: string
          es_prueba?: boolean
          etapa?: string
          filtros?: Json
          hasta?: string
          id?: string
          meta_original?: number
          meta_valor?: number
          metrica?: string
          nombre?: string
          orden?: number
          repite_de?: string | null
          responsable?: string
          se_repite?: boolean
          tipo_periodo?: string
          unidad?: string
        }
        Relationships: [
          {
            foreignKeyName: "metas_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metas_repite_de_fkey"
            columns: ["repite_de"]
            isOneToOne: false
            referencedRelation: "metas"
            referencedColumns: ["id"]
          },
        ]
      }
      metas_cambios: {
        Row: {
          campo: string
          creado_en: string
          id: number
          meta_id: string
          motivo: string
          quien: string | null
          valor_anterior: string | null
          valor_nuevo: string | null
        }
        Insert: {
          campo: string
          creado_en?: string
          id?: never
          meta_id: string
          motivo: string
          quien?: string | null
          valor_anterior?: string | null
          valor_nuevo?: string | null
        }
        Update: {
          campo?: string
          creado_en?: string
          id?: never
          meta_id?: string
          motivo?: string
          quien?: string | null
          valor_anterior?: string | null
          valor_nuevo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "metas_cambios_meta_id_fkey"
            columns: ["meta_id"]
            isOneToOne: false
            referencedRelation: "metas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metas_cambios_quien_fkey"
            columns: ["quien"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      metas_cierres: {
        Row: {
          cerrado_en: string
          desde: string
          hasta: string
          id: number
          meta: number
          meta_id: string
          porcentaje: number | null
          resultado: string
          valor: number | null
        }
        Insert: {
          cerrado_en?: string
          desde: string
          hasta: string
          id?: never
          meta: number
          meta_id: string
          porcentaje?: number | null
          resultado: string
          valor?: number | null
        }
        Update: {
          cerrado_en?: string
          desde?: string
          hasta?: string
          id?: never
          meta?: number
          meta_id?: string
          porcentaje?: number | null
          resultado?: string
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "metas_cierres_meta_id_fkey"
            columns: ["meta_id"]
            isOneToOne: false
            referencedRelation: "metas"
            referencedColumns: ["id"]
          },
        ]
      }
      metas_fotos: {
        Row: {
          dia: string
          estado: string
          meta_id: string
          porcentaje: number | null
          valor: number | null
        }
        Insert: {
          dia: string
          estado: string
          meta_id: string
          porcentaje?: number | null
          valor?: number | null
        }
        Update: {
          dia?: string
          estado?: string
          meta_id?: string
          porcentaje?: number | null
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "metas_fotos_meta_id_fkey"
            columns: ["meta_id"]
            isOneToOne: false
            referencedRelation: "metas"
            referencedColumns: ["id"]
          },
        ]
      }
      navegadores_equipo: {
        Row: {
          creado_en: string
          perfil_id: string | null
          visita_id: string
        }
        Insert: {
          creado_en?: string
          perfil_id?: string | null
          visita_id: string
        }
        Update: {
          creado_en?: string
          perfil_id?: string | null
          visita_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "navegadores_equipo_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      nichos: {
        Row: {
          en_registro: boolean
          id: string
          nombre: string
          orden: number
          tiene_plantilla: boolean
        }
        Insert: {
          en_registro?: boolean
          id: string
          nombre: string
          orden: number
          tiene_plantilla?: boolean
        }
        Update: {
          en_registro?: boolean
          id?: string
          nombre?: string
          orden?: number
          tiene_plantilla?: boolean
        }
        Relationships: []
      }
      nucleos: {
        Row: {
          estado: string
          id: string
          nombre: string
          orden: number
          plantilla: string | null
        }
        Insert: {
          estado?: string
          id: string
          nombre: string
          orden: number
          plantilla?: string | null
        }
        Update: {
          estado?: string
          id?: string
          nombre?: string
          orden?: number
          plantilla?: string | null
        }
        Relationships: []
      }
      objetivos: {
        Row: {
          id: string
          orden: number
          texto: string
        }
        Insert: {
          id: string
          orden: number
          texto: string
        }
        Update: {
          id?: string
          orden?: number
          texto?: string
        }
        Relationships: []
      }
      oportunidades: {
        Row: {
          actualizado_en: string
          ciudad: string | null
          cliente_plantilla_id: string | null
          contacto: string | null
          conversacion_id: string | null
          creado_en: string
          email: string | null
          es_prueba: boolean
          etapa: string
          etapa_desde: string
          id: string
          local_id: string | null
          motivo_perdida: string | null
          motivo_perdida_texto: string | null
          negocio: string
          nicho_id: string | null
          origen: string
          perfil_id: string | null
          probabilidad: number | null
          proximo_paso: string | null
          proximo_paso_fecha: string | null
          responsable: string
          telefono: string | null
          valor_abono: number | null
          valor_proyecto: number | null
        }
        Insert: {
          actualizado_en?: string
          ciudad?: string | null
          cliente_plantilla_id?: string | null
          contacto?: string | null
          conversacion_id?: string | null
          creado_en?: string
          email?: string | null
          es_prueba?: boolean
          etapa?: string
          etapa_desde?: string
          id?: string
          local_id?: string | null
          motivo_perdida?: string | null
          motivo_perdida_texto?: string | null
          negocio: string
          nicho_id?: string | null
          origen: string
          perfil_id?: string | null
          probabilidad?: number | null
          proximo_paso?: string | null
          proximo_paso_fecha?: string | null
          responsable?: string
          telefono?: string | null
          valor_abono?: number | null
          valor_proyecto?: number | null
        }
        Update: {
          actualizado_en?: string
          ciudad?: string | null
          cliente_plantilla_id?: string | null
          contacto?: string | null
          conversacion_id?: string | null
          creado_en?: string
          email?: string | null
          es_prueba?: boolean
          etapa?: string
          etapa_desde?: string
          id?: string
          local_id?: string | null
          motivo_perdida?: string | null
          motivo_perdida_texto?: string | null
          negocio?: string
          nicho_id?: string | null
          origen?: string
          perfil_id?: string | null
          probabilidad?: number | null
          proximo_paso?: string | null
          proximo_paso_fecha?: string | null
          responsable?: string
          telefono?: string | null
          valor_abono?: number | null
          valor_proyecto?: number | null
        }
        Relationships: []
      }
      oportunidades_actividad: {
        Row: {
          creado_en: string
          es_prueba: boolean
          etapa_anterior: string | null
          etapa_nueva: string | null
          id: number
          oportunidad_id: string
          quien: string | null
          resultado: string | null
          tipo: string
        }
        Insert: {
          creado_en?: string
          es_prueba?: boolean
          etapa_anterior?: string | null
          etapa_nueva?: string | null
          id?: number
          oportunidad_id: string
          quien?: string | null
          resultado?: string | null
          tipo: string
        }
        Update: {
          creado_en?: string
          es_prueba?: boolean
          etapa_anterior?: string | null
          etapa_nueva?: string | null
          id?: number
          oportunidad_id?: string
          quien?: string | null
          resultado?: string | null
          tipo?: string
        }
        Relationships: []
      }
      perfiles: {
        Row: {
          acepta_novedades: boolean
          acepto_privacidad_en: string
          actualizado_en: string
          apellido: string | null
          bienvenida_enviada_en: string | null
          ciudad: string | null
          creado_en: string
          email: string
          email_confirmado_en: string | null
          empresa: string | null
          id: string
          nicho_id: string
          nicho_otro: string | null
          nombre: string
          objetivo_id: string
          origen: string | null
          rol: Database["public"]["Enums"]["rol"]
          telefono: string | null
        }
        Insert: {
          acepta_novedades?: boolean
          acepto_privacidad_en?: string
          actualizado_en?: string
          apellido?: string | null
          bienvenida_enviada_en?: string | null
          ciudad?: string | null
          creado_en?: string
          email: string
          email_confirmado_en?: string | null
          empresa?: string | null
          id: string
          nicho_id: string
          nicho_otro?: string | null
          nombre: string
          objetivo_id: string
          origen?: string | null
          rol?: Database["public"]["Enums"]["rol"]
          telefono?: string | null
        }
        Update: {
          acepta_novedades?: boolean
          acepto_privacidad_en?: string
          actualizado_en?: string
          apellido?: string | null
          bienvenida_enviada_en?: string | null
          ciudad?: string | null
          creado_en?: string
          email?: string
          email_confirmado_en?: string | null
          empresa?: string | null
          id?: string
          nicho_id?: string
          nicho_otro?: string | null
          nombre?: string
          objetivo_id?: string
          origen?: string | null
          rol?: Database["public"]["Enums"]["rol"]
          telefono?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "perfiles_nicho_id_fkey"
            columns: ["nicho_id"]
            isOneToOne: false
            referencedRelation: "nichos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "perfiles_objetivo_id_fkey"
            columns: ["objetivo_id"]
            isOneToOne: false
            referencedRelation: "objetivos"
            referencedColumns: ["id"]
          },
        ]
      }
      permisos_metricas: {
        Row: {
          accion: string
          cargado_por: string | null
          cliente_id: string
          creado_en: string
          detalle: string | null
          fecha: string
          id: number
          medio: string
          quien: string
        }
        Insert: {
          accion: string
          cargado_por?: string | null
          cliente_id: string
          creado_en?: string
          detalle?: string | null
          fecha?: string
          id?: number
          medio: string
          quien: string
        }
        Update: {
          accion?: string
          cargado_por?: string | null
          cliente_id?: string
          creado_en?: string
          detalle?: string | null
          fecha?: string
          id?: number
          medio?: string
          quien?: string
        }
        Relationships: []
      }
      tipo_cambio_mensual: {
        Row: {
          cargado_por: string | null
          creado_en: string
          fuente: string | null
          mes: string
          pesos_por_dolar: number
        }
        Insert: {
          cargado_por?: string | null
          creado_en?: string
          fuente?: string | null
          mes: string
          pesos_por_dolar: number
        }
        Update: {
          cargado_por?: string | null
          creado_en?: string
          fuente?: string | null
          mes?: string
          pesos_por_dolar?: number
        }
        Relationships: [
          {
            foreignKeyName: "tipo_cambio_mensual_cargado_por_fkey"
            columns: ["cargado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      visitas: {
        Row: {
          clave_cliente: string | null
          creado_en: string
          es_prueba: boolean
          fecha: string
          feedback: Database["public"]["Enums"]["feedback"]
          id: string
          local_id: string
          nota: string | null
          que_se_mostro: string | null
          siguiente_paso: string | null
          visitante_id: string
          volver: Database["public"]["Enums"]["volver"] | null
        }
        Insert: {
          clave_cliente?: string | null
          creado_en?: string
          es_prueba?: boolean
          fecha?: string
          feedback: Database["public"]["Enums"]["feedback"]
          id?: string
          local_id: string
          nota?: string | null
          que_se_mostro?: string | null
          siguiente_paso?: string | null
          visitante_id?: string
          volver?: Database["public"]["Enums"]["volver"] | null
        }
        Update: {
          clave_cliente?: string | null
          creado_en?: string
          es_prueba?: boolean
          fecha?: string
          feedback?: Database["public"]["Enums"]["feedback"]
          id?: string
          local_id?: string
          nota?: string | null
          que_se_mostro?: string | null
          siguiente_paso?: string | null
          visitante_id?: string
          volver?: Database["public"]["Enums"]["volver"] | null
        }
        Relationships: [
          {
            foreignKeyName: "visitas_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitas_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locales_resumen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitas_visitante_id_fkey"
            columns: ["visitante_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      locales_resumen: {
        Row: {
          actualizado_en: string | null
          cantidad_visitas: number | null
          cargado_por: string | null
          ciudad: string | null
          contacto: string | null
          creado_en: string | null
          direccion: string | null
          direccion_normalizada: string | null
          es_prueba: boolean | null
          estado: Database["public"]["Enums"]["estado_local"] | null
          id: string | null
          latitud: number | null
          link_google_maps: string | null
          longitud: number | null
          nicho_id: string | null
          nombre: string | null
          origen: Database["public"]["Enums"]["origen_local"] | null
          osm_id: string | null
          provincia: string | null
          proxima_visita: string | null
          rubro: string | null
          telefono: string | null
          ubicacion_pendiente: boolean | null
          ultima_visita: string | null
          ultimo_feedback: Database["public"]["Enums"]["feedback"] | null
          ultimo_visitante_id: string | null
          volver: Database["public"]["Enums"]["volver"] | null
          web: string | null
        }
        Relationships: [
          {
            foreignKeyName: "locales_cargado_por_fkey"
            columns: ["cargado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locales_nicho_id_fkey"
            columns: ["nicho_id"]
            isOneToOne: false
            referencedRelation: "nichos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitas_visitante_id_fkey"
            columns: ["ultimo_visitante_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      revisar_visitas_interesantes: { Args: never; Returns: number }
      atencion_nicho: {
        Args: { desde: string; hasta: string; nicho: string }
        Returns: {
          detalle: string
          tipo: string
          visitas: number
        }[]
      }
      embudo_nicho: {
        Args: { desde: string; hasta: string; nicho: string }
        Returns: Json
      }
      metricas_nichos: {
        Args: { desde: string }
        Returns: {
          clics_contacto: number
          clics_demo: number
          confirmados: number
          inicios_registro: number
          nicho_id: string
          registros: number
          vistas: number
        }[]
      }
      resumen_registros: { Args: never; Returns: Json }
      resumen_visitas: { Args: never; Returns: Json }
      visitantes_por_dia: {
        Args: { desde: string; hasta: string }
        Returns: {
          dia: string
          visita_id: string
        }[]
      }
    }
    Enums: {
      estado_cliente: "demo_mostrada" | "en_prueba" | "activo" | "baja"
      estado_local:
        | "por_visitar"
        | "visitado"
        | "interesado"
        | "cliente"
        | "descartado"
      feedback: "bueno" | "regular" | "malo"
      origen_local: "manual" | "importado"
      rol: "usuario" | "admin"
      tipo_evento:
        | "vista_nicho"
        | "clic_demo"
        | "clic_contacto"
        | "inicio_registro"
        | "registro_completo"
        | "email_confirmado"
        | "visita"
        | "tiempo_nicho"
        | "profundidad_nicho"
        | "origen"
      volver: "si" | "mas_adelante" | "no"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      estado_cliente: ["demo_mostrada", "en_prueba", "activo", "baja"],
      estado_local: [
        "por_visitar",
        "visitado",
        "interesado",
        "cliente",
        "descartado",
      ],
      feedback: ["bueno", "regular", "malo"],
      origen_local: ["manual", "importado"],
      rol: ["usuario", "admin"],
      tipo_evento: [
        "vista_nicho",
        "clic_demo",
        "clic_contacto",
        "inicio_registro",
        "registro_completo",
        "email_confirmado",
        "visita",
        "tiempo_nicho",
        "profundidad_nicho",
        "origen",
      ],
      volver: ["si", "mas_adelante", "no"],
    },
  },
} as const
