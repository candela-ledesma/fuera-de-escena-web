import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getBlobStoreId, isBlobUrlFromStore } from "./blob";

describe("getBlobStoreId", () => {
  it("usa BLOB_STORE_ID (con o sin prefijo store_)", () => {
    assert.equal(getBlobStoreId({ BLOB_STORE_ID: "store_vLxAC27HCTHwyGO4" }), "vLxAC27HCTHwyGO4");
    assert.equal(getBlobStoreId({ BLOB_STORE_ID: "vLxAC27HCTHwyGO4" }), "vLxAC27HCTHwyGO4");
  });

  it("prioriza BLOB_STORE_ID sobre el token", () => {
    assert.equal(
      getBlobStoreId({ BLOB_STORE_ID: "store_Aaa111", BLOB_READ_WRITE_TOKEN: "vercel_blob_rw_Bbb222_secret" }),
      "Aaa111",
    );
  });

  it("saca el id de un token read-write válido", () => {
    assert.equal(getBlobStoreId({ BLOB_READ_WRITE_TOKEN: "vercel_blob_rw_vLxAC27HCTHwyGO4_Xy9secret" }), "vLxAC27HCTHwyGO4");
  });

  it("con un token de formato desconocido devuelve null (y entonces no se borra nada)", () => {
    assert.equal(getBlobStoreId({ BLOB_READ_WRITE_TOKEN: "otro_formato_de_token" }), null);
    assert.equal(getBlobStoreId({ BLOB_READ_WRITE_TOKEN: "vercel_blob_ro_abc_secret" }), null);
    assert.equal(getBlobStoreId({ BLOB_STORE_ID: "store_con-guion" }), null);
  });

  it("sin credenciales devuelve null", () => {
    assert.equal(getBlobStoreId({}), null);
  });
});

describe("isBlobUrlFromStore", () => {
  const url = "https://vlxac27hcthwygo4.public.blob.vercel-storage.com/reviews/obra-1.png";

  it("no distingue mayúsculas entre el id y el subdominio", () => {
    assert.equal(isBlobUrlFromStore(url, "vLxAC27HCTHwyGO4"), true);
    assert.equal(isBlobUrlFromStore(url.replace("vlxac27", "VLXAC27"), "vlxac27hcthwygo4"), true);
  });

  it("rechaza otro store, otro dominio y URLs inválidas", () => {
    assert.equal(isBlobUrlFromStore(url, "OtroStore123"), false);
    assert.equal(
      isBlobUrlFromStore("https://vlxac27hcthwygo4.public.blob.vercel-storage.com.evil.com/x.png", "vLxAC27HCTHwyGO4"),
      false,
    );
    assert.equal(isBlobUrlFromStore("no es una url", "vLxAC27HCTHwyGO4"), false);
  });
});
