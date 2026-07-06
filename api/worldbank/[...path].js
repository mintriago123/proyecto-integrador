const WORLD_BANK_BASE_URL = "https://api.worldbank.org";

function getPathSegments(pathParam) {
  if (Array.isArray(pathParam)) {
    return pathParam;
  }

  if (typeof pathParam === "string" && pathParam.length > 0) {
    return [pathParam];
  }

  return [];
}

function appendQueryParams(targetUrl, query) {
  for (const [key, value] of Object.entries(query)) {
    if (key === "path" || value === undefined) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        targetUrl.searchParams.append(key, item);
      }
      continue;
    }

    targetUrl.searchParams.append(key, value);
  }
}

export default async function handler(req, res) {
  const pathSegments = getPathSegments(req.query.path);
  const targetUrl = new URL(
    `/v2/${pathSegments.map(encodeURIComponent).join("/")}`,
    WORLD_BANK_BASE_URL,
  );

  appendQueryParams(targetUrl, req.query);

  try {
    const upstreamResponse = await fetch(targetUrl, {
      headers: {
        accept: "application/json",
        "user-agent": "proyecto-integrador-vercel-proxy",
      },
    });

    const responseBody = await upstreamResponse.text();
    const contentType = upstreamResponse.headers.get("content-type");

    if (contentType) {
      res.setHeader("content-type", contentType);
    }

    // Cache World Bank responses briefly to reduce repeated upstream hits.
    res.setHeader("cache-control", "s-maxage=3600, stale-while-revalidate=86400");
    res.status(upstreamResponse.status).send(responseBody);
  } catch (error) {
    res.status(502).json({
      message: "No se pudo consultar World Bank.",
      detail: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
