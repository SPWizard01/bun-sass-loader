declare module "*.module.scss" {
  const content: string;
  export const code: string;
  export default content;
}

declare module "*.scss" {
  const content: string;
  export default content;
}

declare module "*.svg" {
  const content: string;
  export default content;
}