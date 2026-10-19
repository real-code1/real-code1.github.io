import java.util.Scanner;

public class RecursionDemo {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        System.out.print("Enter a non-negative integer: ");
        int n = scanner.nextInt();

        if (n < 0) {
            System.out.println("Please enter a non-negative integer.");
            return;
        }

        System.out.println("The sum from 0 to " + n + " is " + sumTo(n) + ".");
    }

    public static int sumTo(int n) {
        if (n == 0) {
            return 0;
        }
        return n + sumTo(n - 1);
    }
}
