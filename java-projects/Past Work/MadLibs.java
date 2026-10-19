import java.util.Scanner;

public class MadLibs {
    public static void main(String[] args) {
        Scanner input = new Scanner(System.in);

        System.out.print("Enter a name: ");
        String name = input.nextLine();

        int number;
        while (true) {
            System.out.print("Enter a whole number: ");
            if (input.hasNextInt()) {
                number = input.nextInt();
                input.nextLine();
                break;
            }
            System.out.println("Please enter a whole number. Try again.");
            input.nextLine();
        }

        System.out.print("Enter an adjective: ");
        String adjective = input.nextLine();

        System.out.print("Enter a place: ");
        String place = input.nextLine();

        System.out.printf("%s went to %s and saw %d %s things!%n",
                name, place, number, adjective);

        input.close();
    }
}