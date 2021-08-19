import {
  TextureFactory,
  TextureFactoryLoader,
  TextureOptionClasses,
} from 'three-vertex-objects';
// eslint-disable-next-line import/no-unresolved
import {useAsset} from 'use-asset';

export function useTextureFactoryLoader(
  url: string,
  options: Array<TextureOptionClasses>,
  textureFactory?: TextureFactory,
) {
  return useAsset(
    ([url, options]: [string, Array<TextureOptionClasses>]) => {
      const loader = new TextureFactoryLoader(
        textureFactory ?? new TextureFactory(),
      );
      return loader.loadAsync(url, options);
    },
    [url, options],
  );
}