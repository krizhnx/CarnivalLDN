import { Helmet } from 'react-helmet-async'

interface SEOProps {
  title: string
  description: string
  keywords?: string
  image?: string
  url?: string
  type?: 'website' | 'article' | 'event'
}

const SEO = ({ 
  title, 
  description, 
  keywords = "Carnival LDN, London events, nightlife London, club nights London, Bollywood parties London, Diwali celebrations London, New Year parties London, corporate events London, private parties London, event planning London",
  image = "/carnival-logo.svg",
  url = "https://carnivalldn.com",
  type = "website"
}: SEOProps) => {
  const fullTitle = `${title} | Carnival LDN - London's Premier Events Company`
  
  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content="Carnival LDN" />
      <meta name="robots" content="index, follow" />
      
      {/* Canonical URL */}
      <link rel="canonical" href={url} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="Carnival LDN" />
      <meta property="og:locale" content="en_GB" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@carnivalldn" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      
      {/* Additional SEO Meta Tags */}
      <meta name="geo.region" content="GB-LND" />
      <meta name="geo.placename" content="London" />
      <meta name="geo.position" content="51.5074;-0.1278" />
      <meta name="ICBM" content="51.5074, -0.1278" />
      
      {/* Business Schema */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Event",
          "name": "Carnival LDN Events",
          "description": "London's premier professional events company, creating exceptional experiences that elevate your brand and strengthen business relationships.",
          "url": "https://carnivalldn.com",
          "logo": "https://carnivalldn.com/carnival-logo.svg",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "123 Event Street",
            "addressLocality": "London",
            "addressCountry": "GB"
          },
          "contactPoint": {
            "@type": "ContactPoint",
            "telephone": "+44-20-1234-5678",
            "contactType": "customer service",
            "email": "partnerships@carnivalldn.com"
          },
          "sameAs": [
            "https://instagram.com/carnivalldn",
            "https://facebook.com/carnivalldn",
            "https://twitter.com/carnivalldn"
          ]
        })}
      </script>
    </Helmet>
  )
}

export default SEO
