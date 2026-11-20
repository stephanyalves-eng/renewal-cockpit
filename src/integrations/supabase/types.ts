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
      app_admins: {
        Row: {
          added_at: string
          user_id: string
        }
        Insert: {
          added_at?: string
          user_id: string
        }
        Update: {
          added_at?: string
          user_id?: string
        }
        Relationships: []
      }
      benchmarks: {
        Row: {
          as_of: string
          billing_basis: string
          list_currency: string
          list_price: number
          list_price_per_seat: number
          reference_product: string
          source_url: string
          vendor_id: string
        }
        Insert: {
          as_of: string
          billing_basis: string
          list_currency: string
          list_price: number
          list_price_per_seat: number
          reference_product: string
          source_url: string
          vendor_id: string
        }
        Update: {
          as_of?: string
          billing_basis?: string
          list_currency?: string
          list_price?: number
          list_price_per_seat?: number
          reference_product?: string
          source_url?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "benchmarks_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: true
            referencedRelation: "v_fy_landing"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "benchmarks_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: true
            referencedRelation: "v_renewals_due"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "benchmarks_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: true
            referencedRelation: "v_vendor_detail"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "benchmarks_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: true
            referencedRelation: "vendors"
            referencedColumns: ["vendor_id"]
          },
        ]
      }
      budget: {
        Row: {
          budget_amount: number
          budget_qty: number
          budget_unit_price: number
          month: string
          vendor_id: string
        }
        Insert: {
          budget_amount: number
          budget_qty: number
          budget_unit_price: number
          month: string
          vendor_id: string
        }
        Update: {
          budget_amount?: number
          budget_qty?: number
          budget_unit_price?: number
          month?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "v_fy_landing"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "budget_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "v_renewals_due"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "budget_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "v_vendor_detail"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "budget_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["vendor_id"]
          },
        ]
      }
      contract_extractions: {
        Row: {
          confidence: number | null
          contract_id: string | null
          extracted_at: string
          extracted_value: string | null
          extraction_id: number
          field: string
          file_name: string
          model: string | null
          uncertain: boolean
        }
        Insert: {
          confidence?: number | null
          contract_id?: string | null
          extracted_at?: string
          extracted_value?: string | null
          extraction_id?: never
          field: string
          file_name: string
          model?: string | null
          uncertain?: boolean
        }
        Update: {
          confidence?: number | null
          contract_id?: string | null
          extracted_at?: string
          extracted_value?: string | null
          extraction_id?: never
          field?: string
          file_name?: string
          model?: string | null
          uncertain?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "contract_extractions_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["contract_id"]
          },
          {
            foreignKeyName: "contract_extractions_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "v_renewals_due"
            referencedColumns: ["contract_id"]
          },
          {
            foreignKeyName: "contract_extractions_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "v_vendor_detail"
            referencedColumns: ["contract_id"]
          },
        ]
      }
      contracts: {
        Row: {
          annual_value: number
          auto_renew: boolean
          billing_model: string
          contract_id: string
          end_date: string
          notice_days: number
          price_escalator_pct: number
          seats_contracted: number | null
          start_date: string
          status: string
          termination_fee: number
          unit_price: number
          vendor_id: string
        }
        Insert: {
          annual_value: number
          auto_renew: boolean
          billing_model: string
          contract_id: string
          end_date: string
          notice_days: number
          price_escalator_pct: number
          seats_contracted?: number | null
          start_date: string
          status: string
          termination_fee: number
          unit_price: number
          vendor_id: string
        }
        Update: {
          annual_value?: number
          auto_renew?: boolean
          billing_model?: string
          contract_id?: string
          end_date?: string
          notice_days?: number
          price_escalator_pct?: number
          seats_contracted?: number | null
          start_date?: string
          status?: string
          termination_fee?: number
          unit_price?: number
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "v_fy_landing"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "contracts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "v_renewals_due"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "contracts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "v_vendor_detail"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "contracts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["vendor_id"]
          },
        ]
      }
      forecast_monthly: {
        Row: {
          billing_model: string
          contract_id: string
          forecast_amount: number
          forecast_qty: number
          forecast_unit_price: number
          method: string
          month: string
          vendor_id: string
        }
        Insert: {
          billing_model: string
          contract_id: string
          forecast_amount: number
          forecast_qty: number
          forecast_unit_price: number
          method: string
          month: string
          vendor_id: string
        }
        Update: {
          billing_model?: string
          contract_id?: string
          forecast_amount?: number
          forecast_qty?: number
          forecast_unit_price?: number
          method?: string
          month?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forecast_monthly_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["contract_id"]
          },
          {
            foreignKeyName: "forecast_monthly_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "v_renewals_due"
            referencedColumns: ["contract_id"]
          },
          {
            foreignKeyName: "forecast_monthly_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "v_vendor_detail"
            referencedColumns: ["contract_id"]
          },
          {
            foreignKeyName: "forecast_monthly_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "v_fy_landing"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "forecast_monthly_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "v_renewals_due"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "forecast_monthly_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "v_vendor_detail"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "forecast_monthly_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["vendor_id"]
          },
        ]
      }
      headcount: {
        Row: {
          department: string
          headcount: number
          month: string
        }
        Insert: {
          department: string
          headcount: number
          month: string
        }
        Update: {
          department?: string
          headcount?: number
          month?: string
        }
        Relationships: []
      }
      monthly_spend: {
        Row: {
          actual_amount: number
          billed_qty: number
          contract_id: string
          month: string
          seats_active: number | null
          unit_price_paid: number
          units_used: number | null
          vendor_id: string
        }
        Insert: {
          actual_amount: number
          billed_qty: number
          contract_id: string
          month: string
          seats_active?: number | null
          unit_price_paid: number
          units_used?: number | null
          vendor_id: string
        }
        Update: {
          actual_amount?: number
          billed_qty?: number
          contract_id?: string
          month?: string
          seats_active?: number | null
          unit_price_paid?: number
          units_used?: number | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "monthly_spend_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["contract_id"]
          },
          {
            foreignKeyName: "monthly_spend_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "v_renewals_due"
            referencedColumns: ["contract_id"]
          },
          {
            foreignKeyName: "monthly_spend_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "v_vendor_detail"
            referencedColumns: ["contract_id"]
          },
          {
            foreignKeyName: "monthly_spend_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "v_fy_landing"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "monthly_spend_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "v_renewals_due"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "monthly_spend_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "v_vendor_detail"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "monthly_spend_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["vendor_id"]
          },
        ]
      }
      recommendations: {
        Row: {
          auto_renew: boolean
          category: string
          consolidate_into: string | null
          contract_id: string
          days_to_deadline: number
          decision_deadline: string
          end_date: string
          estimated_annual_impact: number
          notice_days: number
          peak_active_seats: number | null
          rationale: string
          recommendation: string
          rule: string
          target_seats: number | null
          urgent: boolean
          utilization: number | null
          vendor_id: string
          vendor_name: string
        }
        Insert: {
          auto_renew: boolean
          category: string
          consolidate_into?: string | null
          contract_id: string
          days_to_deadline: number
          decision_deadline: string
          end_date: string
          estimated_annual_impact: number
          notice_days: number
          peak_active_seats?: number | null
          rationale: string
          recommendation: string
          rule: string
          target_seats?: number | null
          urgent: boolean
          utilization?: number | null
          vendor_id: string
          vendor_name: string
        }
        Update: {
          auto_renew?: boolean
          category?: string
          consolidate_into?: string | null
          contract_id?: string
          days_to_deadline?: number
          decision_deadline?: string
          end_date?: string
          estimated_annual_impact?: number
          notice_days?: number
          peak_active_seats?: number | null
          rationale?: string
          recommendation?: string
          rule?: string
          target_seats?: number | null
          urgent?: boolean
          utilization?: number | null
          vendor_id?: string
          vendor_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "recommendations_consolidate_into_fkey"
            columns: ["consolidate_into"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["contract_id"]
          },
          {
            foreignKeyName: "recommendations_consolidate_into_fkey"
            columns: ["consolidate_into"]
            isOneToOne: false
            referencedRelation: "v_renewals_due"
            referencedColumns: ["contract_id"]
          },
          {
            foreignKeyName: "recommendations_consolidate_into_fkey"
            columns: ["consolidate_into"]
            isOneToOne: false
            referencedRelation: "v_vendor_detail"
            referencedColumns: ["contract_id"]
          },
          {
            foreignKeyName: "recommendations_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: true
            referencedRelation: "contracts"
            referencedColumns: ["contract_id"]
          },
          {
            foreignKeyName: "recommendations_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: true
            referencedRelation: "v_renewals_due"
            referencedColumns: ["contract_id"]
          },
          {
            foreignKeyName: "recommendations_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: true
            referencedRelation: "v_vendor_detail"
            referencedColumns: ["contract_id"]
          },
          {
            foreignKeyName: "recommendations_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "v_fy_landing"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "recommendations_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "v_renewals_due"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "recommendations_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "v_vendor_detail"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "recommendations_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["vendor_id"]
          },
        ]
      }
      savings: {
        Row: {
          annualized_impact: number
          baseline_price: number
          date: string
          event_id: string
          negotiated_price: number
          note: string | null
          type: string
          vendor_id: string
        }
        Insert: {
          annualized_impact: number
          baseline_price: number
          date: string
          event_id: string
          negotiated_price: number
          note?: string | null
          type: string
          vendor_id: string
        }
        Update: {
          annualized_impact?: number
          baseline_price?: number
          date?: string
          event_id?: string
          negotiated_price?: number
          note?: string | null
          type?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "savings_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "v_fy_landing"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "savings_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "v_renewals_due"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "savings_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "v_vendor_detail"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "savings_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["vendor_id"]
          },
        ]
      }
      scenario: {
        Row: {
          anchor_date: string
          currency: string
          fiscal_year: number
          ipca_annual_pct: number
          near_term_renewal_days: number
          renewal_window_days: number
          scenario_id: number
          seed: number
          urgent_deadline_days: number
        }
        Insert: {
          anchor_date: string
          currency: string
          fiscal_year: number
          ipca_annual_pct: number
          near_term_renewal_days: number
          renewal_window_days: number
          scenario_id: number
          seed: number
          urgent_deadline_days: number
        }
        Update: {
          anchor_date?: string
          currency?: string
          fiscal_year?: number
          ipca_annual_pct?: number
          near_term_renewal_days?: number
          renewal_window_days?: number
          scenario_id?: number
          seed?: number
          urgent_deadline_days?: number
        }
        Relationships: []
      }
      variance: {
        Row: {
          actual_amount: number
          actual_qty: number
          actual_unit_price: number | null
          budget_amount: number
          budget_qty: number | null
          budget_unit_price: number | null
          category: string
          fiscal_year: number
          month: string
          owner_department: string
          price_var: number
          scope: string
          total_var: number
          unbudgeted_var: number
          vendor_id: string
          volume_var: number
        }
        Insert: {
          actual_amount: number
          actual_qty: number
          actual_unit_price?: number | null
          budget_amount: number
          budget_qty?: number | null
          budget_unit_price?: number | null
          category: string
          fiscal_year: number
          month: string
          owner_department: string
          price_var: number
          scope: string
          total_var: number
          unbudgeted_var: number
          vendor_id: string
          volume_var: number
        }
        Update: {
          actual_amount?: number
          actual_qty?: number
          actual_unit_price?: number | null
          budget_amount?: number
          budget_qty?: number | null
          budget_unit_price?: number | null
          category?: string
          fiscal_year?: number
          month?: string
          owner_department?: string
          price_var?: number
          scope?: string
          total_var?: number
          unbudgeted_var?: number
          vendor_id?: string
          volume_var?: number
        }
        Relationships: [
          {
            foreignKeyName: "variance_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "v_fy_landing"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "variance_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "v_renewals_due"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "variance_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "v_vendor_detail"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "variance_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["vendor_id"]
          },
        ]
      }
      vendors: {
        Row: {
          capability: string
          category: string
          criticality: string
          name: string
          owner_department: string
          risk_tier: string
          vendor_id: string
        }
        Insert: {
          capability: string
          category: string
          criticality: string
          name: string
          owner_department: string
          risk_tier: string
          vendor_id: string
        }
        Update: {
          capability?: string
          category?: string
          criticality?: string
          name?: string
          owner_department?: string
          risk_tier?: string
          vendor_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_fy_landing: {
        Row: {
          actual_ytd: number | null
          budget_fy: number | null
          category: string | null
          fiscal_year: number | null
          forecast_rest_of_year: number | null
          landing: number | null
          landing_vs_budget: number | null
          landing_vs_budget_pct: number | null
          owner_department: string | null
          unbudgeted: boolean | null
          vendor_id: string | null
          vendor_name: string | null
        }
        Relationships: []
      }
      v_fy_landing_by_category: {
        Row: {
          actual_ytd: number | null
          budget_fy: number | null
          category: string | null
          fiscal_year: number | null
          forecast_rest_of_year: number | null
          landing: number | null
          landing_vs_budget: number | null
          landing_vs_budget_pct: number | null
        }
        Relationships: []
      }
      v_kpis: {
        Row: {
          anchor_date: string | null
          cost_avoidance_ytd: number | null
          fiscal_year: number | null
          fy_budget: number | null
          fy_landing: number | null
          landing_vs_budget: number | null
          landing_vs_budget_pct: number | null
          recommended_annual_impact: number | null
          renewals_next_90_days: number | null
          savings_ytd: number | null
          urgent_decisions: number | null
          value_at_risk_auto_renewal: number | null
        }
        Relationships: []
      }
      v_monthly_trend: {
        Row: {
          actual: number | null
          budget: number | null
          category: string | null
          forecast: number | null
          month: string | null
          owner_department: string | null
        }
        Relationships: []
      }
      v_renewals_due: {
        Row: {
          annual_value: number | null
          auto_renew: boolean | null
          category: string | null
          consolidate_into: string | null
          contract_id: string | null
          days_to_deadline: number | null
          days_to_end: number | null
          decision_deadline: string | null
          end_date: string | null
          estimated_annual_impact: number | null
          notice_days: number | null
          rationale: string | null
          recommendation: string | null
          rule: string | null
          status: string | null
          target_seats: number | null
          urgent: boolean | null
          utilization: number | null
          vendor_id: string | null
          vendor_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recommendations_consolidate_into_fkey"
            columns: ["consolidate_into"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["contract_id"]
          },
          {
            foreignKeyName: "recommendations_consolidate_into_fkey"
            columns: ["consolidate_into"]
            isOneToOne: false
            referencedRelation: "v_renewals_due"
            referencedColumns: ["contract_id"]
          },
          {
            foreignKeyName: "recommendations_consolidate_into_fkey"
            columns: ["consolidate_into"]
            isOneToOne: false
            referencedRelation: "v_vendor_detail"
            referencedColumns: ["contract_id"]
          },
        ]
      }
      v_seat_utilization: {
        Row: {
          contract_id: string | null
          month: string | null
          seats_active: number | null
          seats_contracted: number | null
          utilization: number | null
          vendor_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "monthly_spend_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["contract_id"]
          },
          {
            foreignKeyName: "monthly_spend_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "v_renewals_due"
            referencedColumns: ["contract_id"]
          },
          {
            foreignKeyName: "monthly_spend_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "v_vendor_detail"
            referencedColumns: ["contract_id"]
          },
          {
            foreignKeyName: "monthly_spend_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "v_fy_landing"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "monthly_spend_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "v_renewals_due"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "monthly_spend_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "v_vendor_detail"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "monthly_spend_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["vendor_id"]
          },
        ]
      }
      v_variance_waterfall: {
        Row: {
          budget: number | null
          category: string | null
          fiscal_year: number | null
          landing: number | null
          owner_department: string | null
          price: number | null
          scope: string | null
          unbudgeted: number | null
          volume: number | null
        }
        Relationships: []
      }
      v_vendor_detail: {
        Row: {
          annual_value: number | null
          auto_renew: boolean | null
          benchmark_as_of: string | null
          benchmark_price_per_seat: number | null
          benchmark_product: string | null
          benchmark_source_url: string | null
          billing_model: string | null
          capability: string | null
          category: string | null
          contract_id: string | null
          criticality: string | null
          decision_deadline: string | null
          end_date: string | null
          estimated_annual_impact: number | null
          fy_budget: number | null
          fy_landing: number | null
          notice_days: number | null
          owner_department: string | null
          price_escalator_pct: number | null
          price_vs_benchmark_pct: number | null
          recommendation: string | null
          risk_tier: string | null
          rule_explanation: string | null
          seats_contracted: number | null
          start_date: string | null
          status: string | null
          termination_fee: number | null
          unit_price: number | null
          utilization_3m: number | null
          vendor_id: string | null
          vendor_name: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      is_app_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
