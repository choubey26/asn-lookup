package com.example.asnlookup.asn_lookup.service;

import org.springframework.stereotype.Service;

import java.io.*;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.zip.GZIPInputStream;

@Service
public class AsnDataCollectionAndComparisonService {

    private static final Map<String, String> RIR_URLS = Map.of(
            "afrinic", "https://ftp.afrinic.net/pub/stats/afrinic/delegated-afrinic-latest",
            "apnic", "https://ftp.apnic.net/stats/apnic/delegated-apnic-latest",
            "arin", "https://ftp.arin.net/pub/stats/arin/delegated-arin-extended-latest",
            "lacnic", "https://ftp.lacnic.net/pub/stats/lacnic/delegated-lacnic-latest",
            "ripe", "https://ftp.ripe.net/pub/stats/ripencc/delegated-ripencc-latest"
    );

    private final Set<String> indianAsnsFromRIRs = new TreeSet<>();
    private final Set<String> indianAsnsFromCaida = new TreeSet<>();


    private final String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));

    // Fetch Indian ASNs from all RIRs
    public List<String> fetchAndExportIndianAsns() {
        List<String> indianAsns = new ArrayList<>();

        for (Map.Entry<String, String> entry : RIR_URLS.entrySet()) {
            String rirName = entry.getKey();
            String rirUrl = entry.getValue();

            try (Scanner scanner = new Scanner(new URL(rirUrl).openStream())) {
                while (scanner.hasNextLine()) {
                    String line = scanner.nextLine();

                    if (line.startsWith("#") || !line.contains("|asn|")) continue;

                    String[] parts = line.split("\\|");
                    if (parts.length < 7) continue;

                    String country = parts[1];
                    String type = parts[2];
                    String startStr = parts[3];
                    String countStr = parts[4];
                    String status = parts[6];

                    if (!"asn".equals(type) || !"IN".equals(country)) continue;
                    if (!"allocated".equals(status) && !"assigned".equals(status)) continue;

                    try {
                        int start = Integer.parseInt(startStr);
                        int count = Integer.parseInt(countStr);

                        for (int asn = start; asn < start + count; asn++) {
                            indianAsns.add("AS"+ String.valueOf(asn));
                        }

                    } catch (NumberFormatException e) {
                        System.err.println("Failed to parse ASN from line: " + line);
                    }
                }
            } catch (IOException e) {
                System.err.println("Error reading from: " + rirUrl);
                e.printStackTrace();
            }
        }

        return indianAsns;
    }


    // Fetch Indian ASNs from CAIDA dataset
    public List<String> fetchIndianAsnsFromCaida() {
        List<String> indianAsnsFromCaida = new ArrayList<>();
        String timestamp = String.valueOf(System.currentTimeMillis());

        try (InputStream inputStream = new GZIPInputStream(
                new URL("https://publicdata.caida.org/datasets/asrank_202505_55410/ASN55410.tar.gz").openStream());
             BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {

            String line;
            while ((line = reader.readLine()) != null) {
                String asn = extractField(line, "\"asn\":");
                String country = extractField(line, "\"country\":");

                if (asn != null && "IN".equalsIgnoreCase(country)) {
                    indianAsnsFromCaida.add("AS" + asn);
                }
            }

            System.out.println("Total ASNs for India (CAIDA): " + indianAsnsFromCaida.size());

            String filename = "indian_asns_caida_" + timestamp + ".txt";
            try (BufferedWriter writer = Files.newBufferedWriter(Path.of(filename))) {
                for (String asn : indianAsnsFromCaida) {
                    writer.write(asn);
                    writer.newLine();
                }
            }

            System.out.println("Indian ASNs (CAIDA) written to: " + filename);

        } catch (IOException e) {
            System.err.println("Error fetching or parsing CAIDA ASN data");
            e.printStackTrace();
        }

        return indianAsnsFromCaida;
    }



    // Compare and write missing ASNs
    public List<String> writeMissingAsnsToFile(Set<String> indianAsnsFromRIRs, Set<String> indianAsnsFromCaida) {
        Set<String> missingAsns = new TreeSet<>(indianAsnsFromRIRs);
        missingAsns.removeAll(indianAsnsFromCaida);

        System.out.println("RIR ASNs: " + indianAsnsFromRIRs.size());
        System.out.println("CAIDA ASNs: " + indianAsnsFromCaida.size());
        System.out.println("Missing ASNs: " + missingAsns.size());

        String outputFile = "missing_asns_in_caida_" + System.currentTimeMillis() + ".txt";

        try (BufferedWriter writer = Files.newBufferedWriter(Path.of(outputFile))) {
            for (String asn : missingAsns) {
                writer.write(asn);
                writer.newLine();
            }
            System.out.println("✅ Missing ASNs written to: " + outputFile);
        } catch (IOException e) {
            System.err.println("❌ Failed to write missing ASN list.");
            e.printStackTrace();
        }

        return new ArrayList<>(missingAsns);  // Return list for response
    }


    // Utility to extract a value from a JSON line
    private String extractField(String json, String field) {
        int idx = json.indexOf(field);
        if (idx == -1) return null;
        int start = idx + field.length();
        int end = json.indexOf(",", start);
        if (end == -1) end = json.indexOf("}", start);
        String value = json.substring(start, end).replaceAll("\"", "").trim();
        return value.isEmpty() ? null : value;
    }

    // Runner method to execute the full pipeline
    public List<String> runFullComparisonPipeline() {
        Set<String> rirAsns = new HashSet<>(fetchAndExportIndianAsns());
        Set<String> caidaAsns = new HashSet<>(fetchIndianAsnsFromCaida());

        return writeMissingAsnsToFile(rirAsns, caidaAsns);
    }




}
