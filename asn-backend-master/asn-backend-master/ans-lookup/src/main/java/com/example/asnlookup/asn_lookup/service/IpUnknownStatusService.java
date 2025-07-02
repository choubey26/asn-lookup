package com.example.asnlookup.asn_lookup.service;

import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.file.*;
import java.util.ArrayList;
import java.util.List;

@Service
public class IpUnknownStatusService {

    public List<String> extractAsnAndIpFromFile(String inputFilePath) {
        List<String> extractedData = new ArrayList<>();

        String outputDir = "asn_data";
        String outputFilePath = outputDir + "/prefixes_All_ASN_.txt";

        try {
            // Ensure output directory exists
            Path dirPath = Paths.get(outputDir);
            if (!Files.exists(dirPath)) {
                Files.createDirectories(dirPath);
            }

            try (
                    BufferedReader reader = Files.newBufferedReader(Paths.get(inputFilePath));
                    BufferedWriter writer = Files.newBufferedWriter(Paths.get(outputFilePath),
                            StandardOpenOption.CREATE, StandardOpenOption.APPEND)
            ) {
                String line;
                while ((line = reader.readLine()) != null) {
                    String[] parts = line.split(",");
                    if (parts.length >= 4) {
                        String asn = parts[0].trim();
                        String ip = parts[3].trim().replace('x', '0');
                        String formatted = asn + "," + ip;

                        extractedData.add(formatted);
                        writer.write(formatted);
                        writer.newLine(); // ✅ platform-independent actual new line
                    }
                }
                writer.flush(); // ✅ ensure all data is written
                System.out.println("✅ ASN and IP data written to " + outputFilePath);
            }

        } catch (IOException e) {
            System.err.println("❌ Error processing file: " + e.getMessage());
        }

        return extractedData;
    }
}
