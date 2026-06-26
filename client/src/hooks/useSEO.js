import { useEffect } from 'react';

const useSEO = ({ title, description, schema }) => {
  useEffect(() => {
    if (title) {
      document.title = `${title} | NexORA Luxury`;
    }
    if (description) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.name = 'description';
        document.head.appendChild(metaDesc);
      }
      metaDesc.content = description;
    }
    if (schema) {
      let script = document.querySelector('#seo-schema');
      if (!script) {
        script = document.createElement('script');
        script.type = 'application/ld+json';
        script.id = 'seo-schema';
        document.head.appendChild(script);
      }
      script.text = JSON.stringify(schema);
    }
    return () => {
      const script = document.querySelector('#seo-schema');
      if (script) {
        script.remove();
      }
    };
  }, [title, description, schema]);
};

export default useSEO;
