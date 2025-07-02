package com.example.asnlookup.asn_lookup.service;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.stereotype.Service;

import java.io.BufferedWriter;
import java.io.FileWriter;
import java.io.IOException;
import java.nio.file.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class spoofingDetailesService {

    private static final String BASE_URL = "https://spoofer.caida.org/recent_tests.php?country_include=ind&as_include=";
    private static final String OUTPUT_DIR = "output";

    public Map<String, List<String>> processAsnsFromFileAndReturn(String filePath) {
        Map<String, List<String>> categoryMap = new HashMap<>();

        try {
            System.out.println("Reading ASN file from path: " + filePath);
            List<String> asnList = Files.readAllLines(Paths.get(filePath));
            createOutputDirectory();

            for (String asn : asnList) {
                asn = asn.trim();
                asn="AS"+asn;
                if (asn.isEmpty()) continue;

                try {
                    String category = processAsnAndCategorize(asn);
                    categoryMap.computeIfAbsent(category, k -> new ArrayList<>()).add(asn);
                } catch (Exception e) {
                    System.err.println("Error processing ASN " + asn + ": " + e.getMessage());
                    categoryMap.computeIfAbsent("error", k -> new ArrayList<>()).add(asn + " - " + e.getMessage());
                }
            }
        } catch (IOException e) {
            System.err.println("Error reading ASN file: " + e.getMessage());
        }

        return categoryMap;
    }


    private String processAsnAndCategorize(String asn) throws IOException {
        String url = BASE_URL + asn;
        boolean hasNext = true;
        boolean found = false;

        while (hasNext && url != null) {
            Document doc = getWithRetry(url);
            Elements rows = doc.select("table tr");

            for (Element row : rows.subList(1, rows.size())) {
                Elements cols = row.select("td");
                if (cols.size() < 7) continue;

                String spoofStatus = cols.get(6).text().trim().toLowerCase();
                String nextStatus = cols.get(7).text().trim().toLowerCase();

                if (spoofStatus.equals("✔")) {
                    spoofStatus = cols.get(7).text().trim().toLowerCase();
                    nextStatus = cols.get(7).text().trim().toLowerCase();
                }

                if (spoofStatus.equals("unknown") || nextStatus.equals("unknown")) {
                    return "unknown";
                }

                return switch (spoofStatus) {
                    case "received" -> "received";
                    case "rewritten" -> "rewritten";
                    case "blocked" -> "blocked";
                    default -> "no_data";
                };
            }

            // Check pagination
            Element nextLink = doc.selectFirst("a:contains(Next)");
            if (nextLink != null) {
                url = "https://spoofer.caida.org/" + nextLink.attr("href");
            } else {
                hasNext = false;
            }
        }

        return "no_data";
    }


    private Document getWithRetry(String url) throws IOException {
        int retries = 3;
        IOException lastException = null;

        for (int attempt = 1; attempt <= retries; attempt++) {
            try {
                return Jsoup.connect(url)
                        .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
                        .timeout(20000)
                        .get();
            } catch (IOException e) {
                lastException = e;
                System.err.println("Attempt " + attempt + " failed for URL: " + url);
                try {
                    Thread.sleep(2000);
                } catch (InterruptedException ignored) {
                }
            }
        }
        throw lastException;
    }

    private void appendToFile(String fileName, String content) {
        try {
            Path outputPath = Paths.get(OUTPUT_DIR, fileName);
            boolean isNewFile = !Files.exists(outputPath);

            try (BufferedWriter writer = new BufferedWriter(new FileWriter(outputPath.toFile(), true))) {
                if (isNewFile) {
                    writer.write(getCsvHeader());
                    writer.newLine();
                }
                writer.write(content);
                writer.newLine();
                System.out.println("✅ Wrote to " + fileName + ": " + content);
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private String getCsvHeader() {
        return "ASN,Session,Timestamp,Client IP Block,ASN,Country,NAT,Outbound Private Status,Outbound Routable Status,Adj Spoof,Prefix Len,Results";
    }

    private void createOutputDirectory() throws IOException {
        Path dirPath = Paths.get(OUTPUT_DIR);
        if (!Files.exists(dirPath)) {
            Files.createDirectories(dirPath);
            System.out.println("✅ Created output directory: " + dirPath.toAbsolutePath());
        } else {
            System.out.println("Output directory already exists at: " + dirPath.toAbsolutePath());
        }
    }
}
