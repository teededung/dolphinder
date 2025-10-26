declare module 'astro/jsx-runtime' {
  export namespace JSX {
    interface IntrinsicAttributes {
      'client:load'?: boolean;
      'client:idle'?: boolean;
      'client:visible'?: boolean;
      'client:media'?: string;
      'client:only'?: string;
    }
  }
}

