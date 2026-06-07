package main

import (
	"encoding/json"
	"fmt"
	"math/rand"
	"net/http"

	"github.com/go-chi/chi/v5"
)

type Request struct {
	URL string `json:"url"`
}

func generateCode() string {
	chars := "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

	code := ""

	for i := 0; i < 6; i++ {
		code += string(chars[rand.Intn(len(chars))])
	}

	return code
}

func shortenURL(w http.ResponseWriter, r *http.Request) {
	var req Request

	json.NewDecoder(r.Body).Decode(&req)

	code := generateCode()

	response := map[string]string{
		"original_url": req.URL,
		"short_code":   code,
	}

	w.Header().Set("Content-Type", "application/json")

	json.NewEncoder(w).Encode(response)
}

func main() {
	r := chi.NewRouter()

	r.Post("/shorten", shortenURL)

	fmt.Println("Servidor rodando na porta 8080")

	http.ListenAndServe(":8080", r)
}
