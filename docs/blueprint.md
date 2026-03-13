# **App Name**: BizFlow

## Core Features:

- Real-time Business Overview: A live dashboard displaying critical Key Performance Indicators (KPIs) such as Total Suppliers, Total Customers, Active Offers, Pending Responses, and New Customers This Week. Includes trend charts for new customers and customer response types, alongside recent automation log highlights, all powered by real-time Firestore listeners.
- Supplier Management System: Provides a comprehensive and searchable table for managing all supplier entities. Features include adding new suppliers, editing existing details, deleting records, filtering by country and products offered, and displaying a count of associated stock entries. All operations interact directly with Firestore.
- Customer Relationship Manager: A dedicated section for managing customer information. Includes a searchable table with add, edit, and delete functionalities for customer records. Users can filter by interested products and view a summary of each customer's response history, with data sourced from Firestore.
- Inventory Stock Optimization: Presents a detailed view of all stock entries, resolving product and supplier names for clarity. Offers robust filtering capabilities by product, supplier, and price range, alongside sorting options for price and lead time. Highlights the row with the lowest price per product to aid inventory decisions.
- Best Offer Aggregator: Displays an aggregated list of best offers, resolving product and supplier names for easy identification. Features include a badge indicating the 'freshness' (calculated within 7 days) or 'staleness' of an offer, and a button to manually trigger a recalculation process.
- AI-Powered Offer Strategy Tool: An AI tool that intelligently analyzes real-time inventory levels, supplier performance metrics, and historical customer response data. It provides proactive recommendations for optimal timing to trigger offer recalculations and suggests strategic adjustments to maximize conversion rates and profitability.
- Automation Workflow Monitor: A centralized log for all automated business processes, providing a clear overview of automation activities. Features include advanced filtering by pipeline name and status, color-coded status badges (success/failed/pending), and expandable rows to display detailed error information for troubleshooting.

## Style Guidelines:

- Primary interactive color: A sophisticated blue-violet (#755EDE) to evoke trust and intelligence, vibrant enough to stand out against a dark theme for actionable elements.
- Background color: A very dark, desaturated blue-violet (#1A1825) providing a professional, modern canvas for the dashboard.
- Accent color: A softer, bright blue (#5182E0) analogous to the primary, used sparingly for highlights, secondary call-to-actions, and interactive states.
- Body and headline font: 'Inter' (sans-serif) for its modern, neutral, and highly readable characteristics across various content types like tables, forms, and charts.
- Minimalist, line-based (outline) icons will be used for clarity and consistency throughout the interface, particularly in the sidebar navigation and action buttons.
- A clean, spacious grid-based layout for dashboard sections, utilizing a fixed sidebar for primary navigation. Content areas are responsive and dynamically adapt to both desktop and tablet screen sizes, ensuring optimal presentation of cards, tables, and charts.
- Subtle and purposeful animations will enhance user experience, including smooth transitions for page navigation, concise loading skeletons while data is being fetched, and elegant slide-in toast notifications for user feedback on actions.