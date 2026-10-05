import assert from "node:assert/strict";
import test from "node:test";
import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { CoverImage } from "./cover-image";

test("CoverImage defaults to a square card with rounded background", () => {
  const defaultHtml = renderToStaticMarkup(
    createElement(CoverImage, {
      src: "/brand/logo.png",
      alt: "Portada de prueba",
      sizes: "100vw",
      priority: true,
    }),
  );

  assert.match(defaultHtml, /aspect-square/);
  assert.match(defaultHtml, /object-cover/);
  assert.match(defaultHtml, /rounded-\[12px\]/);
});

test("CoverImage can switch to contain mode when needed", () => {
  const html = renderToStaticMarkup(
    createElement(CoverImage, {
      src: "/brand/logo.png",
      alt: "Portada de prueba",
      sizes: "100vw",
      fit: "contain",
      priority: true,
    }),
  );

  assert.match(html, /object-contain/);
  assert.doesNotMatch(html, /object-cover object-center/);
});
