// Generado con: npx.cmd supabase gen types typescript --linked --schema public
// No editar a mano: se regenera después de cada migración.
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
      clientes_plantilla: {
        Row: {
          abono_mensual: number | null
          actualizado_en: string
          cargado_por: string | null
          creado_en: string
          empresa: string
          es_prueba: boolean
          estado: Database["public"]["Enums"]["estado_cliente"]
          fecha: string
          id: string
          local_id: string | null
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
          fecha?: string
          id?: string
          local_id?: string | null
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
          fecha?: string
          id?: string
          local_id?: string | null
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
          cliente_plantilla_id: string | null
          creado_en: string
          es_prueba: boolean
          id: string
          modulos_activos: string[]
          nombre: string
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
          cliente_plantilla_id?: string | null
          creado_en?: string
          es_prueba?: boolean
          id?: string
          modulos_activos?: string[]
          nombre: string
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
          cliente_plantilla_id?: string | null
          creado_en?: string
          es_prueba?: boolean
          id?: string
          modulos_activos?: string[]
          nombre?: string
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
      eventos: {
        Row: {
          creado_en: string
          id: number
          nicho_id: string | null
          pagina: string | null
          perfil_id: string | null
          tipo: Database["public"]["Enums"]["tipo_evento"]
          visita_id: string | null
        }
        Insert: {
          creado_en?: string
          id?: never
          nicho_id?: string | null
          pagina?: string | null
          perfil_id?: string | null
          tipo: Database["public"]["Enums"]["tipo_evento"]
          visita_id?: string | null
        }
        Update: {
          creado_en?: string
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
      locales: {
        Row: {
          actualizado_en: string
          cargado_por: string | null
          ciudad: string | null
          contacto: string | null
          creado_en: string
          direccion: string | null
          direccion_normalizada: string | null
          es_prueba: boolean
          estado: Database["public"]["Enums"]["estado_local"]
          id: string
          latitud: number | null
          longitud: number | null
          nicho_id: string | null
          nombre: string
          origen: Database["public"]["Enums"]["origen_local"]
          link_google_maps: string | null
          osm_id: string | null
          ubicacion_pendiente: boolean
          provincia: string | null
          proxima_visita: string | null
          rubro: string | null
          telefono: string | null
          volver: Database["public"]["Enums"]["volver"] | null
          web: string | null
        }
        Insert: {
          actualizado_en?: string
          cargado_por?: string | null
          ciudad?: string | null
          contacto?: string | null
          creado_en?: string
          direccion?: string | null
          direccion_normalizada?: string | null
          es_prueba?: boolean
          estado?: Database["public"]["Enums"]["estado_local"]
          id?: string
          latitud?: number | null
          longitud?: number | null
          nicho_id?: string | null
          nombre: string
          origen?: Database["public"]["Enums"]["origen_local"]
          link_google_maps?: string | null
          osm_id?: string | null
          ubicacion_pendiente?: boolean
          provincia?: string | null
          proxima_visita?: string | null
          rubro?: string | null
          telefono?: string | null
          volver?: Database["public"]["Enums"]["volver"] | null
          web?: string | null
        }
        Update: {
          actualizado_en?: string
          cargado_por?: string | null
          ciudad?: string | null
          contacto?: string | null
          creado_en?: string
          direccion?: string | null
          direccion_normalizada?: string | null
          es_prueba?: boolean
          estado?: Database["public"]["Enums"]["estado_local"]
          id?: string
          latitud?: number | null
          longitud?: number | null
          nicho_id?: string | null
          nombre?: string
          origen?: Database["public"]["Enums"]["origen_local"]
          link_google_maps?: string | null
          osm_id?: string | null
          ubicacion_pendiente?: boolean
          provincia?: string | null
          proxima_visita?: string | null
          rubro?: string | null
          telefono?: string | null
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
      visitas: {
        Row: {
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
          longitud: number | null
          nicho_id: string | null
          nombre: string | null
          origen: Database["public"]["Enums"]["origen_local"] | null
          link_google_maps: string | null
          osm_id: string | null
          ubicacion_pendiente: boolean | null
          provincia: string | null
          proxima_visita: string | null
          rubro: string | null
          telefono: string | null
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
        | "visita"
        | "vista_nicho"
        | "clic_demo"
        | "clic_contacto"
        | "inicio_registro"
        | "registro_completo"
        | "email_confirmado"
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
        "visita",
        "vista_nicho",
        "clic_demo",
        "clic_contacto",
        "inicio_registro",
        "registro_completo",
        "email_confirmado",
      ],
      volver: ["si", "mas_adelante", "no"],
    },
  },
} as const
