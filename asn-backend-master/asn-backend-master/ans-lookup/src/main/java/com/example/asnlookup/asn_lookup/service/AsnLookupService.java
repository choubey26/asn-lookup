package com.example.asnlookup.asn_lookup.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.io.BufferedWriter;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Service
public class AsnLookupService {

    @Value("${output.directory}")
    private String outputDirectory;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    public AsnLookupService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public String fetchAndSaveAsnDetails(String asn) throws IOException {
        String url = "https://stat.ripe.net/data/announced-prefixes/data.json?resource=" + asn;

        ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
            throw new RuntimeException("Failed to fetch data from RIPEstat API for ASN: " + asn);
        }

        Path directoryPath = Paths.get(outputDirectory);
        Files.createDirectories(directoryPath);

        String safeFileName = asn.replaceAll("[^a-zA-Z0-9]", "_") + "_asn_details.json";
        Path filePath = directoryPath.resolve(safeFileName);
        try (BufferedWriter writer = Files.newBufferedWriter(filePath)) {
            writer.write(response.getBody());
        }

        return response.getBody();
    }

    // ✅ Add a static inner @Configuration class *inside* the same file:
    @Configuration
    public static class RestTemplateProvider {
        @Bean
        public RestTemplate restTemplate() {
            return new RestTemplate();
        }
    }
}
