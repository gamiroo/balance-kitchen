'use client'

import { useEffect } from 'react'

declare global {
  interface Window {
    $zoho?: {
      salesiq?: {
        widgetcode?: string
        values?: object
        ready?: () => void
      }
    }
  }
}

interface ZohoSalesIQProps {
  enabled?: boolean
}

export function ZohoSalesIQ({ enabled = true }: ZohoSalesIQProps) {
  useEffect(() => {
    // Don't load in development
    if (process.env.NODE_ENV === 'development' || !enabled) {
      return
    }

    // Check if already initialized
    if (window.$zoho?.salesiq) {
      return
    }

    // Initialize Zoho SalesIQ
    const initZoho = () => {
      // Set up the global object
      window.$zoho = window.$zoho || {}
      window.$zoho.salesiq = {
        widgetcode: "3274da875261252d9d22d19e914f360abb6bd28b6476690a2aa7ae9d06a44145",
        values: {},
        ready: function() {}
      }

      // Create and inject the script
      const script = document.createElement('script')
      script.id = 'zsiqscript'
      script.type = 'text/javascript'
      script.defer = true
      script.src = 'https://salesiq.zoho.com.au/widget'
      
      const firstScript = document.getElementsByTagName('script')[0]
      if (firstScript.parentNode) {
        firstScript.parentNode.insertBefore(script, firstScript)
      }
    }

    // Initialize the widget
    initZoho()

    // Cleanup function (optional)
    return () => {
      // Remove script if needed
      const script = document.getElementById('zsiqscript')
      if (script) {
        script.remove()
      }
      
      // Clean up global object if needed
      // Note: Be careful with cleanup as it might interfere with widget functionality
    }
  }, [enabled])

  return null
}
